import { v4 as uuidv4 } from 'uuid';
import status from 'http-status';
import AppError from '../../errorHelpers/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { IQueryParams } from '../../interfaces/query.interface.js';
import { computePrice, detectRegionType } from '../pricing/pricing.service.js';
import { determineDeliveryType, planShipmentRoute } from './routePlanning.service.js';

type PaymentMethod = 'STRIPE' | 'COD';
type Priority = 'STANDARD' | 'EXPRESS';
type ShipmentStatus = 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED';

const generateTrackingNumber = () => `TRK-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;

const shipmentInclude = {
  sender: { select: { id: true, name: true, email: true, phone: true } },
  merchant: { select: { id: true, companyName: true } },
  courier: { include: { user: { select: { id: true, name: true, phone: true } } } },
  payment: true,
  pricing: true,
  events: { orderBy: { timestamp: 'desc' as const } },
  legs: {
    orderBy: { legNumber: 'asc' as const },
    include: {
      courier: { include: { user: { select: { id: true, name: true, phone: true } } } },
      originHub: true,
      destHub: true,
    },
  },
};

const createShipment = async (
  senderId: string,
  senderRole: string,
  payload: {
    pickupAddress: string;
    pickupCity: string;
    pickupPhone: string;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryPhone: string;
    packageType: string;
    weight: number;
    priority?: Priority;
    paymentMethod: PaymentMethod;
    note?: string;
  },
) => {
  const trackingNumber = generateTrackingNumber();
  const priority: Priority = payload.priority ?? 'STANDARD';
  const regionType = detectRegionType(payload.pickupCity, payload.deliveryCity);

  const pricingConfig = await prisma.pricing.findUnique({ where: { regionType } });
  if (!pricingConfig) throw new AppError(status.BAD_REQUEST, `No pricing configured for region: ${regionType}`);

  const { basePrice, weightCharge, priorityCharge, totalPrice } = computePrice(pricingConfig, payload.weight, priority);

  let merchantId: string | undefined;
  if (senderRole === 'MERCHANT') {
    const merchant = await prisma.merchant.findUnique({ where: { userId: senderId } });
    if (merchant) merchantId = merchant.id;
  }

  const deliveryType = determineDeliveryType(regionType);
  const legPlans = await planShipmentRoute({
    pickupAddress: payload.pickupAddress,
    pickupCity: payload.pickupCity,
    deliveryAddress: payload.deliveryAddress,
    deliveryCity: payload.deliveryCity,
    weight: payload.weight,
    priority,
    regionType,
  });

  return prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({
      data: {
        trackingNumber,
        senderId,
        merchantId,
        pickupAddress: payload.pickupAddress,
        pickupCity: payload.pickupCity,
        pickupPhone: payload.pickupPhone,
        deliveryAddress: payload.deliveryAddress,
        deliveryCity: payload.deliveryCity,
        deliveryPhone: payload.deliveryPhone,
        packageType: payload.packageType,
        weight: payload.weight,
        priority,
        paymentStatus: payload.paymentMethod === 'COD' ? 'COD' : 'PENDING',
        note: payload.note,
        deliveryType,
      },
      include: shipmentInclude,
    });

    await tx.payment.create({
      data: {
        shipmentId: shipment.id,
        amount: totalPrice,
        method: payload.paymentMethod,
        status: payload.paymentMethod === 'COD' ? 'COD' : 'PENDING',
      },
    });

    await tx.shipmentPricing.create({
      data: { shipmentId: shipment.id, regionType, basePrice, weightCharge, priorityCharge, totalPrice },
    });

    await tx.shipmentEvent.create({
      data: { shipmentId: shipment.id, status: 'PENDING', updatedBy: senderId },
    });

    for (const legPlan of legPlans) {
      await tx.shipmentLeg.create({
        data: {
          shipmentId: shipment.id,
          legNumber: legPlan.legNumber,
          legType: legPlan.legType,
          originType: legPlan.originType,
          originAddress: legPlan.originAddress,
          originHubId: legPlan.originHubId,
          destType: legPlan.destType,
          destAddress: legPlan.destAddress,
          destHubId: legPlan.destHubId,
          status: 'PENDING',
        },
      });
    }

    const firstLeg = await tx.shipmentLeg.findFirst({
      where: { shipmentId: shipment.id, legNumber: 1 },
    });
    if (firstLeg) {
      await tx.shipment.update({
        where: { id: shipment.id },
        data: { currentLegId: firstLeg.id },
      });
    }

    return shipment;
  });
};

const getAllShipments = async (queryParams: IQueryParams) => {
  return new QueryBuilder(prisma.shipment, queryParams, {
    searchableFields: ['trackingNumber', 'pickupAddress', 'deliveryAddress'],
    filterableFields: ['status', 'paymentStatus', 'priority'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include(shipmentInclude)
    .execute();
};

const getMyShipments = async (userId: string, queryParams: IQueryParams) => {
  return new QueryBuilder(prisma.shipment, queryParams, {
    searchableFields: ['trackingNumber', 'pickupAddress', 'deliveryAddress'],
    filterableFields: ['status', 'paymentStatus', 'priority'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .where({ senderId: userId })
    .include(shipmentInclude)
    .execute();
};

const getMyCourierShipments = async (userId: string, queryParams: IQueryParams) => {
  const courier = await prisma.courier.findUnique({ where: { userId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier profile not found.');

  return new QueryBuilder(prisma.shipment, queryParams, {
    filterableFields: ['status'],
  })
    .filter()
    .sort()
    .paginate()
    .where({ courierId: courier.id })
    .include(shipmentInclude)
    .execute();
};

const getShipmentById = async (id: string) => {
  const shipment = await prisma.shipment.findUnique({ where: { id }, include: shipmentInclude });
  if (!shipment) throw new AppError(status.NOT_FOUND, 'Shipment not found.');
  return shipment;
};

const trackShipment = async (trackingNumber: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber },
    include: {
      events: { orderBy: { timestamp: 'desc' as const } },
      courier: { include: { user: { select: { name: true, phone: true } } } },
      legs: {
        orderBy: { legNumber: 'asc' as const },
        include: {
          courier: { include: { user: { select: { name: true, phone: true } } } },
          originHub: true,
          destHub: true,
        },
      },
    },
  });
  if (!shipment) throw new AppError(status.NOT_FOUND, 'Shipment not found with this tracking number.');
  return shipment;
};

const assignCourier = async (shipmentId: string, courierId: string, adminId: string) => {
  const shipment = await prisma.shipment.findUnique({ 
    where: { id: shipmentId },
    include: { legs: { orderBy: { legNumber: 'asc' } } }
  });
  if (!shipment) throw new AppError(status.NOT_FOUND, 'Shipment not found.');
  if (shipment.status !== 'PENDING') throw new AppError(status.BAD_REQUEST, 'Only PENDING shipments can be assigned.');

  const courier = await prisma.courier.findUnique({ where: { id: courierId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier not found.');
  if (!courier.availability) throw new AppError(status.BAD_REQUEST, 'Courier is not available.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.shipment.update({
      where: { id: shipmentId },
      data: { courierId, status: 'ASSIGNED' },
      include: shipmentInclude,
    });

    await tx.shipmentEvent.create({
      data: { shipmentId, status: 'ASSIGNED', updatedBy: adminId },
    });

    // If shipment has legs, assign the first leg to the courier
    if (shipment.legs && shipment.legs.length > 0) {
      const firstLeg = shipment.legs[0];
      await tx.shipmentLeg.update({
        where: { id: firstLeg.id },
        data: { 
          courierId,
          status: 'ASSIGNED'
        },
      });
    }

    await tx.notification.create({
      data: {
        shipmentId,
        userId: courier.userId,
        role: 'COURIER',
        message: `New shipment assigned: ${shipment.trackingNumber}`,
      },
    });

    return updated;
  });
};

const updateShipmentStatus = async (
  shipmentId: string,
  courierId: string,
  payload: { status: ShipmentStatus; note?: string; proofOfDelivery?: string },
) => {
  const courier = await prisma.courier.findUnique({ where: { userId: courierId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier profile not found.');

  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) throw new AppError(status.NOT_FOUND, 'Shipment not found.');
  if (shipment.courierId !== courier.id) throw new AppError(status.FORBIDDEN, 'This shipment is not assigned to you.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.shipment.update({
      where: { id: shipmentId },
      data: {
        status: payload.status,
        proofOfDelivery: payload.proofOfDelivery,
        paymentStatus: payload.status === 'DELIVERED' && shipment.paymentStatus === 'COD' ? 'PAID' : undefined,
      },
      include: shipmentInclude,
    });

    await tx.shipmentEvent.create({
      data: { shipmentId, status: payload.status, updatedBy: courierId, note: payload.note },
    });

    await tx.notification.create({
      data: {
        shipmentId,
        userId: shipment.senderId,
        role: 'USER',
        message: `Your shipment ${shipment.trackingNumber} is now ${payload.status}.`,
      },
    });

    return updated;
  });
};

const getAvailableShipments = async (queryParams: IQueryParams) => {
  return new QueryBuilder(prisma.shipment, queryParams, {
    searchableFields: ['trackingNumber', 'pickupAddress', 'deliveryAddress'],
    filterableFields: ['priority'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .where({ status: 'PENDING', courierId: null })
    .include(shipmentInclude)
    .execute();
};

const acceptShipment = async (shipmentId: string, userId: string) => {
  const courier = await prisma.courier.findUnique({ where: { userId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier profile not found.');
  if (courier.approvalStatus !== 'APPROVED') throw new AppError(status.FORBIDDEN, 'Your courier account is not approved yet.');
  if (!courier.availability) throw new AppError(status.BAD_REQUEST, 'You must be available to accept shipments.');

  const shipment = await prisma.shipment.findUnique({ 
    where: { id: shipmentId },
    include: { legs: { orderBy: { legNumber: 'asc' } } }
  });
  if (!shipment) throw new AppError(status.NOT_FOUND, 'Shipment not found.');
  if (shipment.status !== 'PENDING') throw new AppError(status.BAD_REQUEST, 'This shipment is no longer available.');
  if (shipment.courierId) throw new AppError(status.BAD_REQUEST, 'This shipment is already assigned.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.shipment.update({
      where: { id: shipmentId },
      data: { courierId: courier.id, status: 'ASSIGNED' },
      include: shipmentInclude,
    });

    await tx.shipmentEvent.create({
      data: { shipmentId, status: 'ASSIGNED', updatedBy: userId },
    });

    // If shipment has legs, assign the first leg to the courier
    if (shipment.legs && shipment.legs.length > 0) {
      const firstLeg = shipment.legs[0];
      await tx.shipmentLeg.update({
        where: { id: firstLeg.id },
        data: { 
          courierId: courier.id,
          status: 'ASSIGNED'
        },
      });
    }

    await tx.notification.create({
      data: {
        shipmentId,
        userId: shipment.senderId,
        role: 'USER',
        message: `Your shipment ${shipment.trackingNumber} has been accepted by a courier.`,
      },
    });

    return updated;
  });
};

export const ShipmentService = {
  createShipment,
  getAllShipments,
  getMyShipments,
  getMyCourierShipments,
  getShipmentById,
  trackShipment,
  assignCourier,
  updateShipmentStatus,
  getAvailableShipments,
  acceptShipment,
};
