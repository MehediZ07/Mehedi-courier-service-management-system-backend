import { v4 as uuidv4 } from 'uuid';
import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { IQueryParams } from '../../interfaces/query.interface';
import { PaymentMethod, Priority, Role, ShipmentStatus } from '../../generated/prisma';

const generateTrackingNumber = () => `TRK-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;

const shipmentInclude = {
  sender: { select: { id: true, name: true, email: true, phone: true } },
  merchant: { select: { id: true, companyName: true } },
  courier: { include: { user: { select: { id: true, name: true, phone: true } } } },
  payment: true,
  events: { orderBy: { timestamp: 'desc' as const } },
};

const createShipment = async (
  senderId: string,
  senderRole: Role,
  payload: {
    pickupAddress: string;
    deliveryAddress: string;
    packageType: string;
    weight: number;
    priority?: Priority;
    paymentMethod: PaymentMethod;
    amount: number;
    note?: string;
  },
) => {
  const trackingNumber = generateTrackingNumber();

  let merchantId: string | undefined;
  if (senderRole === Role.MERCHANT) {
    const merchant = await prisma.merchant.findUnique({ where: { userId: senderId } });
    if (merchant) merchantId = merchant.id;
  }

  return prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.create({
      data: {
        trackingNumber,
        senderId,
        merchantId,
        pickupAddress: payload.pickupAddress,
        deliveryAddress: payload.deliveryAddress,
        packageType: payload.packageType,
        weight: payload.weight,
        priority: payload.priority ?? Priority.STANDARD,
        paymentStatus: payload.paymentMethod === PaymentMethod.COD ? 'COD' : 'PENDING',
        note: payload.note,
      },
      include: shipmentInclude,
    });

    await tx.payment.create({
      data: {
        shipmentId: shipment.id,
        amount: payload.amount,
        method: payload.paymentMethod,
        status: payload.paymentMethod === PaymentMethod.COD ? 'COD' : 'PENDING',
      },
    });

    await tx.shipmentEvent.create({
      data: { shipmentId: shipment.id, status: ShipmentStatus.PENDING, updatedBy: senderId },
    });

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
    },
  });
  if (!shipment) throw new AppError(status.NOT_FOUND, 'Shipment not found with this tracking number.');
  return shipment;
};

const assignCourier = async (shipmentId: string, courierId: string, adminId: string) => {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) throw new AppError(status.NOT_FOUND, 'Shipment not found.');
  if (shipment.status !== ShipmentStatus.PENDING) throw new AppError(status.BAD_REQUEST, 'Only PENDING shipments can be assigned.');

  const courier = await prisma.courier.findUnique({ where: { id: courierId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier not found.');
  if (!courier.availability) throw new AppError(status.BAD_REQUEST, 'Courier is not available.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.shipment.update({
      where: { id: shipmentId },
      data: { courierId, status: ShipmentStatus.ASSIGNED },
      include: shipmentInclude,
    });

    await tx.shipmentEvent.create({
      data: { shipmentId, status: ShipmentStatus.ASSIGNED, updatedBy: adminId },
    });

    await tx.notification.create({
      data: {
        shipmentId,
        userId: courier.userId,
        role: Role.COURIER,
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
        paymentStatus: payload.status === ShipmentStatus.DELIVERED && shipment.paymentStatus === 'COD' ? 'PAID' : undefined,
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
        role: Role.USER,
        message: `Your shipment ${shipment.trackingNumber} is now ${payload.status}.`,
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
};
