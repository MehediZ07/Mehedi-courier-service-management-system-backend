import status from 'http-status';
import AppError from '../../errorHelpers/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

type ShipmentStatus = 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED';

const legInclude = {
  shipment: {
    include: {
      sender: { select: { id: true, name: true, email: true, phone: true } },
      pricing: true,
      payment: true,
    },
  },
  courier: {
    include: {
      user: { select: { id: true, name: true, phone: true } },
    },
  },
  originHub: true,
  destHub: true,
};

const getAvailableLegs = async (userId: string, queryParams: IQueryParams) => {
  const courier = await prisma.courier.findUnique({ where: { userId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier profile not found.');
  if (!courier.city) throw new AppError(status.BAD_REQUEST, 'Please update your profile with your city to view available legs.');

  return new QueryBuilder(prisma.shipmentLeg, queryParams, {
    searchableFields: ['shipment.trackingNumber'],
    filterableFields: ['legType'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .where({
      status: 'PENDING',
      courierId: null,
      legType: { in: ['DIRECT', 'PICKUP', 'DELIVERY'] },
      OR: [
        { originType: 'ADDRESS', shipment: { pickupCity: courier.city } },
        { originType: 'HUB', originHub: { city: courier.city } },
      ],
    })
    .include(legInclude)
    .execute();
};

const getMyCourierLegs = async (userId: string, queryParams: IQueryParams) => {
  const courier = await prisma.courier.findUnique({ where: { userId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier profile not found.');

  return new QueryBuilder(prisma.shipmentLeg, queryParams, {
    filterableFields: ['status', 'legType'],
  })
    .filter()
    .sort()
    .paginate()
    .where({ courierId: courier.id })
    .include(legInclude)
    .execute();
};

const acceptLeg = async (legId: string, userId: string) => {
  const courier = await prisma.courier.findUnique({ where: { userId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier profile not found.');
  if (courier.approvalStatus !== 'APPROVED') throw new AppError(status.FORBIDDEN, 'Your courier account is not approved yet.');
  if (!courier.availability) throw new AppError(status.BAD_REQUEST, 'You must be available to accept legs.');

  const leg = await prisma.shipmentLeg.findUnique({ where: { id: legId }, include: { shipment: true } });
  if (!leg) throw new AppError(status.NOT_FOUND, 'Leg not found.');
  if (leg.status !== 'PENDING') throw new AppError(status.BAD_REQUEST, 'This leg is no longer available.');
  if (leg.courierId) throw new AppError(status.BAD_REQUEST, 'This leg is already assigned.');

  return prisma.$transaction(async (tx) => {
    const updatedLeg = await tx.shipmentLeg.update({
      where: { id: legId },
      data: {
        courierId: courier.id,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
      include: legInclude,
    });

    if (leg.legNumber === 1 && leg.shipment.status === 'PENDING') {
      await tx.shipment.update({
        where: { id: leg.shipmentId },
        data: {
          status: 'ASSIGNED',
          courierId: courier.id,
          currentLegId: legId,
        },
      });

      await tx.shipmentEvent.create({
        data: {
          shipmentId: leg.shipmentId,
          status: 'ASSIGNED',
          updatedBy: userId,
          note: `Leg ${leg.legNumber} assigned to courier`,
        },
      });
    } else {
      await tx.shipment.update({
        where: { id: leg.shipmentId },
        data: { currentLegId: legId },
      });
    }

    await tx.notification.create({
      data: {
        shipmentId: leg.shipmentId,
        userId: leg.shipment.senderId,
        role: 'USER',
        message: `Leg ${leg.legNumber} of your shipment ${leg.shipment.trackingNumber} has been accepted by a courier.`,
      },
    });

    return updatedLeg;
  });
};

const markLegPickedUp = async (legId: string, userId: string) => {
  const courier = await prisma.courier.findUnique({ where: { userId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier profile not found.');

  const leg = await prisma.shipmentLeg.findUnique({ where: { id: legId }, include: { shipment: true } });
  if (!leg) throw new AppError(status.NOT_FOUND, 'Leg not found.');
  if (leg.courierId !== courier.id) throw new AppError(status.FORBIDDEN, 'This leg is not assigned to you.');
  if (leg.status !== 'ASSIGNED') throw new AppError(status.BAD_REQUEST, 'Leg must be in ASSIGNED status.');

  return prisma.$transaction(async (tx) => {
    const updatedLeg = await tx.shipmentLeg.update({
      where: { id: legId },
      data: {
        status: 'IN_PROGRESS',
        pickedUpAt: new Date(),
      },
      include: legInclude,
    });

    let newShipmentStatus: ShipmentStatus = 'PICKED_UP';
    if (leg.legType === 'DELIVERY') newShipmentStatus = 'OUT_FOR_DELIVERY';
    else if (leg.legType === 'HUB_TRANSFER') newShipmentStatus = 'IN_TRANSIT';

    await tx.shipment.update({
      where: { id: leg.shipmentId },
      data: { status: newShipmentStatus },
    });

    await tx.shipmentEvent.create({
      data: {
        shipmentId: leg.shipmentId,
        status: newShipmentStatus,
        updatedBy: userId,
        note: `Leg ${leg.legNumber} picked up`,
      },
    });

    await tx.notification.create({
      data: {
        shipmentId: leg.shipmentId,
        userId: leg.shipment.senderId,
        role: 'USER',
        message: `Leg ${leg.legNumber} of your shipment ${leg.shipment.trackingNumber} has been picked up.`,
      },
    });

    return updatedLeg;
  });
};

const markLegDelivered = async (legId: string, userId: string, proofOfDelivery?: string) => {
  const courier = await prisma.courier.findUnique({ where: { userId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier profile not found.');

  const leg = await prisma.shipmentLeg.findUnique({ where: { id: legId }, include: { shipment: true } });
  if (!leg) throw new AppError(status.NOT_FOUND, 'Leg not found.');
  if (leg.courierId !== courier.id) throw new AppError(status.FORBIDDEN, 'This leg is not assigned to you.');
  if (leg.status !== 'IN_PROGRESS') throw new AppError(status.BAD_REQUEST, 'Leg must be in IN_PROGRESS status.');

  return prisma.$transaction(async (tx) => {
    const updatedLeg = await tx.shipmentLeg.update({
      where: { id: legId },
      data: {
        status: 'COMPLETED',
        deliveredAt: new Date(),
      },
      include: legInclude,
    });

    const totalLegs = await tx.shipmentLeg.count({ where: { shipmentId: leg.shipmentId } });
    const isLastLeg = leg.legNumber === totalLegs;

    if (isLastLeg) {
      await tx.shipment.update({
        where: { id: leg.shipmentId },
        data: {
          status: 'DELIVERED',
          proofOfDelivery,
          paymentStatus: leg.shipment.paymentStatus === 'COD' ? 'PAID' : leg.shipment.paymentStatus,
        },
      });

      if (leg.shipment.paymentStatus === 'COD') {
        await tx.payment.updateMany({
          where: { shipmentId: leg.shipmentId },
          data: { status: 'PAID' },
        });
      }

      await tx.shipmentEvent.create({
        data: {
          shipmentId: leg.shipmentId,
          status: 'DELIVERED',
          updatedBy: userId,
          note: `Final delivery completed`,
        },
      });

      await tx.notification.create({
        data: {
          shipmentId: leg.shipmentId,
          userId: leg.shipment.senderId,
          role: 'USER',
          message: `Your shipment ${leg.shipment.trackingNumber} has been delivered successfully!`,
        },
      });
    } else {
      const nextLeg = await tx.shipmentLeg.findFirst({
        where: { shipmentId: leg.shipmentId, legNumber: leg.legNumber + 1 },
      });

      if (nextLeg) {
        const newStatus: ShipmentStatus = 'IN_TRANSIT';

        await tx.shipment.update({
          where: { id: leg.shipmentId },
          data: {
            status: newStatus,
            currentLegId: nextLeg.id,
          },
        });

        await tx.shipmentEvent.create({
          data: {
            shipmentId: leg.shipmentId,
            status: newStatus,
            updatedBy: userId,
            note: `Leg ${leg.legNumber} completed, leg ${nextLeg.legNumber} ready`,
          },
        });

        await tx.notification.create({
          data: {
            shipmentId: leg.shipmentId,
            userId: leg.shipment.senderId,
            role: 'USER',
            message: `Leg ${leg.legNumber} of your shipment ${leg.shipment.trackingNumber} completed. Moving to next stage.`,
          },
        });
      }
    }

    return updatedLeg;
  });
};

const getShipmentLegs = async (shipmentId: string) => {
  return prisma.shipmentLeg.findMany({
    where: { shipmentId },
    orderBy: { legNumber: 'asc' },
    include: legInclude,
  });
};

export const ShipmentLegService = {
  getAvailableLegs,
  getMyCourierLegs,
  acceptLeg,
  markLegPickedUp,
  markLegDelivered,
  getShipmentLegs,
};
