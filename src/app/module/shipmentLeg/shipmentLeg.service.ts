import status from 'http-status';
import AppError from '../../errorHelpers/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { IQueryParams } from '../../interfaces/query.interface.js';
import { planShipmentRoute } from '../shipment/routePlanning.service.js';
import { detectRegionType } from '../pricing/pricing.service.js';

type ShipmentStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SiblingLeg {
  legNumber: number;
  status: string;
  legType?: string;
}

interface ShipmentWithLegs {
  legs: SiblingLeg[];
  trackingNumber?: string;
  senderId?: string;
  pickupCity?: string;
  deliveryCity?: string;
  status?: string;
  productPrice?: number;
  merchantId?: string | null;
  pricing?: { totalPrice: number } | null;
  payment?: { method: string } | null;
}

interface ShipmentLegWithShipment {
  id: string;
  legNumber: number;
  status: string;
  legType: string;
  shipmentId: string;
  courierId?: string | null;
  shipment: ShipmentWithLegs;
  // other fields from include...
  courier?: any;
  originHub?: any;
  destHub?: any;
}

// ─── Include ─────────────────────────────────────────────────────────────────

const legInclude = {
  shipment: {
    include: {
      sender: {
        select: { id: true, name: true, email: true, phone: true },
      },
      legs: {
        select: {
          id: true,
          legNumber: true,
          status: true,
          legType: true,
        },
        orderBy: { legNumber: 'asc' as const },
      },
      pricing: true,
      payment: true,
    },
  },
  courier: {
    include: {
      user: {
        select: { id: true, name: true, phone: true },
      },
    },
  },
  originHub: true,
  destHub: true,
};

// ─── Helper ──────────────────────────────────────────────────────────────────

const assertAllPriorLegsCompleted = async (
  tx: typeof prisma,
  shipmentId: string,
  legNumber: number,
) => {
  if (legNumber <= 1) return;

  const priorLegs = await tx.shipmentLeg.findMany({
    where: { shipmentId, legNumber: { lt: legNumber } },
    orderBy: { legNumber: 'asc' },
    select: { legNumber: true, status: true, legType: true },
  });

  const incompleteLeg = priorLegs.find((l) => l.status !== 'COMPLETED');
  if (incompleteLeg) {
    throw new AppError(
      status.BAD_REQUEST,
      `Leg ${incompleteLeg.legNumber} (${incompleteLeg.legType}) must be COMPLETED before leg ${legNumber} can proceed. Current status: ${incompleteLeg.status}.`,
    );
  }
};

// ─── Main Functions ──────────────────────────────────────────────────────────

const getAvailableLegs = async (userId: string, queryParams: IQueryParams) => {
  const courier = await prisma.courier.findUnique({ where: { userId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier profile not found.');
  if (!courier.city)
    throw new AppError(
      status.BAD_REQUEST,
      'Please update your profile with your city to view available legs.',
    );

  const result = await new QueryBuilder(prisma.shipmentLeg, queryParams, {
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

  // Fix: Assert the type of data (QueryBuilder returns unknown[])
  const rawData = result.data as ShipmentLegWithShipment[];

  const eligibleLegs = rawData.filter((leg) => {
    const siblings: SiblingLeg[] = leg.shipment?.legs ?? [];
    // Allow COMPLETED or FAILED status for prior legs (FAILED is valid for return journeys)
    return !siblings.some(
      (s) => s.legNumber < leg.legNumber && s.status !== 'COMPLETED' && s.status !== 'FAILED',
    );
  });

  return {
    data: eligibleLegs,
    meta: {
      ...result.meta,
      total: result.meta.total - (rawData.length - eligibleLegs.length),
    },
  };
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

  // Validate leg sequence
  if (leg.legNumber > 1) {
    const previousLeg = await prisma.shipmentLeg.findFirst({
      where: { shipmentId: leg.shipmentId, legNumber: leg.legNumber - 1 },
    });
    if (previousLeg && previousLeg.status !== 'COMPLETED') {
      throw new AppError(status.BAD_REQUEST, 'Previous leg must be completed first.');
    }
  }

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

  const leg = await prisma.shipmentLeg.findUnique({ 
    where: { id: legId }, 
    include: { 
      shipment: { 
        include: { 
          pricing: true, 
          payment: true,
          legs: { orderBy: { legNumber: 'asc' } }
        } 
      } 
    } 
  });
  if (!leg) throw new AppError(status.NOT_FOUND, 'Leg not found.');
  if (leg.courierId !== courier.id) throw new AppError(status.FORBIDDEN, 'This leg is not assigned to you.');
  if (leg.status !== 'IN_PROGRESS') throw new AppError(status.BAD_REQUEST, 'Leg must be in IN_PROGRESS status.');

  // Validate leg sequence - allow FAILED legs (for return journeys after delivery failure)
  if (leg.legNumber > 1) {
    const previousLeg = await prisma.shipmentLeg.findFirst({
      where: { shipmentId: leg.shipmentId, legNumber: leg.legNumber - 1 },
    });
    if (previousLeg && previousLeg.status !== 'COMPLETED' && previousLeg.status !== 'FAILED') {
      throw new AppError(status.BAD_REQUEST, 'Previous leg must be completed first.');
    }
  }

  return prisma.$transaction(async (tx) => {
    const totalLegs = await tx.shipmentLeg.count({ where: { shipmentId: leg.shipmentId } });
    const isLastLeg = leg.legNumber === totalLegs;
    const originalPaymentMethod = leg.shipment.payment?.method;
    const isDeliveryLeg = leg.legType === 'DELIVERY' || leg.legType === 'DIRECT';
    const hasProductPrice = leg.shipment.productPrice && leg.shipment.productPrice > 0;

    // Check if this is a return leg (has failed delivery legs before it)
    const failedDeliveryLegs = leg.shipment.legs.filter(
      (l) => l.legNumber < leg.legNumber && (l.legType === 'DELIVERY' || l.legType === 'DIRECT') && l.status === 'FAILED'
    );
    const isReturnLeg = failedDeliveryLegs.length > 0;

    // Calculate courier earning (10% of total price divided by number of legs)
    const earning = leg.shipment.pricing ? (leg.shipment.pricing.totalPrice * 0.1) / totalLegs : 0;

    // Handle cash collection
    let codAmount = 0;
    let codCollected = false;

    if (isDeliveryLeg && isLastLeg) {
      if (isReturnLeg) {
        // RETURN LEG DELIVERY (sender receiving back their product)
        if (originalPaymentMethod === 'COD') {
          // Original was COD → Return shipping is also COD (must collect return cost)
          codAmount = leg.shipment.pricing?.totalPrice || 0; // Return shipping cost
          codCollected = true;
        }
        // If original was STRIPE → Return shipping already paid, no collection needed
      } else {
        // NORMAL FORWARD DELIVERY (receiver receiving product)
        if (originalPaymentMethod === 'COD') {
          // COD = product price + shipment charge
          const productPrice = leg.shipment.productPrice || 0;
          const shipmentCharge = leg.shipment.pricing?.totalPrice || 0;
          codAmount = productPrice + shipmentCharge;
          codCollected = true;
        } else if (hasProductPrice) {
          // Stripe payment but has product price - collect only product price
          codAmount = leg.shipment.productPrice || 0;
          codCollected = true;
        }
      }
    }

    const updatedLeg = await tx.shipmentLeg.update({
      where: { id: legId },
      data: {
        status: 'COMPLETED',
        deliveredAt: new Date(),
        courierEarning: earning,
        codCollected,
        codAmount: codAmount > 0 ? codAmount : undefined,
      },
      include: legInclude,
    });

    // Update courier earnings and pending COD
    await tx.courier.update({
      where: { id: courier.id },
      data: {
        totalEarnings: { increment: earning },
        ...(codAmount > 0 && { pendingCOD: { increment: codAmount } }),
      },
    });

    // Update merchant pending settlement (product price - 1.85% commission) - only for forward deliveries
    if (isLastLeg && !isReturnLeg && leg.shipment.merchantId && leg.shipment.productPrice > 0) {
      const merchantAmount = leg.shipment.productPrice * 0.9815; // 100% - 1.85%
      await tx.merchant.update({
        where: { id: leg.shipment.merchantId },
        data: {
          pendingSettlement: { increment: merchantAmount },
        },
      });
    }

    if (isLastLeg) {
      const finalStatus = isReturnLeg ? 'RETURNED' : 'DELIVERED';
      
      await tx.shipment.update({
        where: { id: leg.shipmentId },
        data: {
          status: finalStatus,
          proofOfDelivery,
          paymentStatus: originalPaymentMethod === 'COD' ? 'PAID' : leg.shipment.paymentStatus,
        },
      });

      if (originalPaymentMethod === 'COD') {
        await tx.payment.updateMany({
          where: { shipmentId: leg.shipmentId },
          data: { status: 'PAID' },
        });
      }

      await tx.shipmentEvent.create({
        data: {
          shipmentId: leg.shipmentId,
          status: finalStatus,
          updatedBy: userId,
          note: isReturnLeg 
            ? `Return delivery completed - Package returned to sender` 
            : `Final delivery completed`,
        },
      });

      await tx.notification.create({
        data: {
          shipmentId: leg.shipmentId,
          userId: leg.shipment.senderId,
          role: 'USER',
          message: isReturnLeg
            ? `Your shipment ${leg.shipment.trackingNumber} has been returned to you successfully.`
            : `Your shipment ${leg.shipment.trackingNumber} has been delivered successfully!`,
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

// Admin endpoints
const getAllLegs = async (queryParams: IQueryParams) => {
  return new QueryBuilder(prisma.shipmentLeg, queryParams, {
    searchableFields: ['shipment.trackingNumber'],
    filterableFields: ['status', 'legType'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include(legInclude)
    .execute();
};

const assignCourierToLeg = async (legId: string, courierId: string) => {
  const leg = await prisma.shipmentLeg.findUnique({ where: { id: legId }, include: { shipment: true } });
  if (!leg) throw new AppError(status.NOT_FOUND, 'Leg not found.');
  if (leg.status !== 'PENDING') throw new AppError(status.BAD_REQUEST, 'Can only assign courier to PENDING legs.');
  if (leg.legType === 'HUB_TRANSFER') throw new AppError(status.BAD_REQUEST, 'Hub transfers cannot be assigned to couriers.');

  const courier = await prisma.courier.findUnique({ where: { id: courierId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier not found.');
  if (courier.approvalStatus !== 'APPROVED') throw new AppError(status.BAD_REQUEST, 'Courier is not approved.');

  // Validate city match
  const legCity = leg.legType === 'PICKUP' ? leg.shipment.pickupCity : leg.shipment.deliveryCity;
  if (courier.city !== legCity) {
    throw new AppError(status.BAD_REQUEST, `Courier city (${courier.city}) does not match leg city (${legCity}).`);
  }

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
          updatedBy: 'ADMIN',
          note: `Leg ${leg.legNumber} assigned to courier by admin`,
        },
      });
    }

    return updatedLeg;
  });
};

const releaseHubTransfer = async (legIds: string[], note?: string) => {
  const legs = await prisma.shipmentLeg.findMany({
    where: { id: { in: legIds } },
    include: { 
      shipment: {
        include: {
          legs: {
            select: { id: true, legNumber: true, status: true, legType: true },
            orderBy: { legNumber: 'asc' }
          }
        }
      } 
    },
  });

  if (legs.length === 0) throw new AppError(status.NOT_FOUND, 'No legs found.');
  
  for (const leg of legs) {
    if (leg.legType !== 'HUB_TRANSFER') throw new AppError(status.BAD_REQUEST, 'Only HUB_TRANSFER legs can be released.');
    if (leg.status !== 'PENDING') throw new AppError(status.BAD_REQUEST, `Leg ${leg.id} is not in PENDING status.`);
    
    // Validate prior legs are completed
    if (leg.legNumber > 1) {
      const priorLegs = leg.shipment.legs.filter(l => l.legNumber < leg.legNumber);
      const incompleteLeg = priorLegs.find(l => l.status !== 'COMPLETED' && l.status !== 'FAILED');
      if (incompleteLeg) {
        throw new AppError(
          status.BAD_REQUEST,
          `Cannot release leg ${leg.legNumber} of shipment ${leg.shipment.trackingNumber}. Leg ${incompleteLeg.legNumber} (${incompleteLeg.legType}) must be COMPLETED first. Current status: ${incompleteLeg.status}.`
        );
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    const updatedLegs = await Promise.all(
      legIds.map((legId) =>
        tx.shipmentLeg.update({
          where: { id: legId },
          data: {
            status: 'IN_PROGRESS',
            pickedUpAt: new Date(),
            note,
          },
          include: legInclude,
        })
      )
    );

    for (const leg of legs) {
      await tx.shipment.update({
        where: { id: leg.shipmentId },
        data: { status: 'IN_TRANSIT' },
      });

    await tx.shipmentEvent.create({
      data: {
        shipmentId: leg.shipmentId,
        status: 'IN_TRANSIT',
        updatedBy: 'SYSTEM',
        note: `Hub transfer leg ${leg.legNumber} released for transit`,
      },
    });
    }

    return updatedLegs;
  });
};

const confirmHubTransfer = async (legIds: string[], note?: string) => {
  const legs = await prisma.shipmentLeg.findMany({
    where: { id: { in: legIds } },
    include: { shipment: true },
  });

  if (legs.length === 0) throw new AppError(status.NOT_FOUND, 'No legs found.');
  
  for (const leg of legs) {
    if (leg.legType !== 'HUB_TRANSFER') throw new AppError(status.BAD_REQUEST, 'Only HUB_TRANSFER legs can be confirmed.');
    if (leg.status !== 'IN_PROGRESS') throw new AppError(status.BAD_REQUEST, `Leg ${leg.id} is not in IN_PROGRESS status.`);
  }

  return prisma.$transaction(async (tx) => {
    const updatedLegs = await Promise.all(
      legIds.map((legId) =>
        tx.shipmentLeg.update({
          where: { id: legId },
          data: {
            status: 'COMPLETED',
            deliveredAt: new Date(),
            note,
          },
          include: legInclude,
        })
      )
    );

    for (const leg of legs) {
      const totalLegs = await tx.shipmentLeg.count({ where: { shipmentId: leg.shipmentId } });
      const isLastLeg = leg.legNumber === totalLegs;

      if (!isLastLeg) {
        const nextLeg = await tx.shipmentLeg.findFirst({
          where: { shipmentId: leg.shipmentId, legNumber: leg.legNumber + 1 },
        });

        if (nextLeg) {
          await tx.shipment.update({
            where: { id: leg.shipmentId },
            data: {
              status: 'IN_TRANSIT',
              currentLegId: nextLeg.id,
            },
          });

          await tx.shipmentEvent.create({
            data: {
              shipmentId: leg.shipmentId,
              status: 'IN_TRANSIT',
              updatedBy: 'SYSTEM',
              note: `Hub transfer leg ${leg.legNumber} completed, leg ${nextLeg.legNumber} ready`,
            },
          });
        }
      }
    }

    return updatedLegs;
  });
};

const markPickupRefused = async (legId: string, userId: string, reason?: string) => {
  const courier = await prisma.courier.findUnique({ where: { userId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier profile not found.');

  const leg = await prisma.shipmentLeg.findUnique({ 
    where: { id: legId }, 
    include: { shipment: { include: { pricing: true, payment: true } } } 
  });
  if (!leg) throw new AppError(status.NOT_FOUND, 'Leg not found.');
  if (leg.courierId !== courier.id) throw new AppError(status.FORBIDDEN, 'This leg is not assigned to you.');
  if (leg.status !== 'ASSIGNED') throw new AppError(status.BAD_REQUEST, 'Can only refuse pickup from ASSIGNED status.');
  if (leg.legType !== 'PICKUP' && leg.legType !== 'DIRECT') {
    throw new AppError(status.BAD_REQUEST, 'Only PICKUP or DIRECT legs can be refused at pickup.');
  }

  return prisma.$transaction(async (tx) => {
    // Mark current leg as FAILED
    await tx.shipmentLeg.update({
      where: { id: legId },
      data: {
        status: 'FAILED',
        note: `Pickup refused/failed - Sender did not handover package. Reason: ${reason || 'Not specified'}`,
      },
    });

    // Mark all other legs as FAILED
    await tx.shipmentLeg.updateMany({
      where: { 
        shipmentId: leg.shipmentId,
        id: { not: legId },
        status: 'PENDING'
      },
      data: { status: 'FAILED' },
    });

    // Mark shipment as CANCELLED (not RETURNED) - no service provided, no charges
    await tx.shipment.update({
      where: { id: leg.shipmentId },
      data: { status: 'CANCELLED' },
    });

    // Cancel payment if it was pending
    if (leg.shipment.payment?.status === 'PENDING') {
      await tx.payment.updateMany({
        where: { shipmentId: leg.shipmentId },
        data: { status: 'FAILED' },
      });
    }

    await tx.shipmentEvent.create({
      data: {
        shipmentId: leg.shipmentId,
        status: 'CANCELLED',
        updatedBy: userId,
        note: `Pickup failed - Sender refused to handover or did not show up. Shipment cancelled. No charges applied. ${reason || ''}`,
      },
    });

    // Notify sender
    await tx.notification.create({
      data: {
        shipmentId: leg.shipmentId,
        userId: leg.shipment.senderId,
        role: 'USER',
        message: `Your shipment ${leg.shipment.trackingNumber} has been cancelled. Pickup was not completed. No charges applied.`,
      },
    });

    return leg;
  });
};

const markDeliveryRefused = async (legId: string, userId: string, reason?: string) => {
  const courier = await prisma.courier.findUnique({ where: { userId } });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier profile not found.');

  const leg = await prisma.shipmentLeg.findUnique({ 
    where: { id: legId }, 
    include: { 
      shipment: { 
        include: { 
          pricing: true, 
          payment: true,
          legs: { orderBy: { legNumber: 'asc' } }
        } 
      } 
    } 
  });
  if (!leg) throw new AppError(status.NOT_FOUND, 'Leg not found.');
  if (leg.courierId !== courier.id) throw new AppError(status.FORBIDDEN, 'This leg is not assigned to you.');
  if (leg.status !== 'IN_PROGRESS') throw new AppError(status.BAD_REQUEST, 'Can only refuse delivery from IN_PROGRESS status.');
  if (leg.legType !== 'DELIVERY' && leg.legType !== 'DIRECT') {
    throw new AppError(status.BAD_REQUEST, 'Only DELIVERY or DIRECT legs can be refused at delivery.');
  }

  // Validate required shipment data
  if (!leg.shipment.pickupAddress || !leg.shipment.pickupCity || !leg.shipment.deliveryAddress || !leg.shipment.deliveryCity) {
    throw new AppError(status.BAD_REQUEST, 'Shipment missing required address information for return routing.');
  }

  // Check if this shipment already has failed delivery legs (indicating it's already a return)
  const failedDeliveryLegs = leg.shipment.legs.filter(
    (l) => (l.legType === 'DELIVERY' || l.legType === 'DIRECT') && l.status === 'FAILED'
  );

  // If this is already a return, find nearest hub BEFORE transaction
  let nearestHub = null;
  if (failedDeliveryLegs.length > 0) {
    nearestHub = await prisma.hub.findFirst({
      where: {
        city: leg.shipment.pickupCity,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!nearestHub) {
      throw new AppError(
        status.NOT_FOUND,
        `No active hub found in ${leg.shipment.pickupCity} to store the package.`,
      );
    }
  }

  // Plan return route BEFORE transaction (if needed)
  let returnLegPlans: any[] = [];
  let returnShippingCost = 0;
  let maxLegNumber = 0;

  if (failedDeliveryLegs.length === 0) {
    // First delivery failure - plan return route
    returnShippingCost = leg.shipment.pricing?.totalPrice || 0;
    maxLegNumber = Math.max(...leg.shipment.legs.map(l => l.legNumber));
    
    const regionType = detectRegionType(leg.shipment.deliveryCity, leg.shipment.pickupCity);
    returnLegPlans = await planShipmentRoute({
      pickupAddress: leg.shipment.deliveryAddress,
      pickupCity: leg.shipment.deliveryCity,
      deliveryAddress: leg.shipment.pickupAddress,
      deliveryCity: leg.shipment.pickupCity,
      weight: leg.shipment.weight,
      priority: leg.shipment.priority as 'STANDARD' | 'EXPRESS',
      regionType,
    });
  }

  // Now execute transaction with all data prepared
  return prisma.$transaction(async (tx) => {
    // Mark current leg as FAILED
    await tx.shipmentLeg.update({
      where: { id: legId },
      data: {
        status: 'FAILED',
        note: failedDeliveryLegs.length > 0
          ? `Return delivery refused by sender. Package will be stored at nearest hub. Reason: ${reason || 'Not specified'}`
          : `Delivery refused by receiver. Reason: ${reason || 'Not specified'}`,
      },
    });

    // If this is already a return (has previous failed delivery), store at hub
    if (failedDeliveryLegs.length > 0 && nearestHub) {
      await tx.shipment.update({
        where: { id: leg.shipmentId },
        data: { 
          status: 'RETURNED',
          note: `Package stored at ${nearestHub.name} - Both receiver and sender refused delivery`,
        },
      });

      await tx.shipmentEvent.create({
        data: {
          shipmentId: leg.shipmentId,
          status: 'RETURNED',
          updatedBy: userId,
          note: `Return delivery refused by sender. Package stored at ${nearestHub.name} (${nearestHub.address}). ${reason || ''}`,
        },
      });

      await tx.notification.create({
        data: {
          shipmentId: leg.shipmentId,
          userId: leg.shipment.senderId,
          role: 'USER',
          message: `Your shipment ${leg.shipment.trackingNumber} could not be delivered. Package is now stored at ${nearestHub.name}. Please contact support to arrange pickup.`,
        },
      });

      return { 
        leg, 
        returnLegs: [], 
        returnShippingCost: 0,
        storedAtHub: nearestHub,
      };
    }

    // This is the first delivery failure - create return legs
    const returnLegs = [];
    for (const plan of returnLegPlans) {
      const isFirstReturnLeg = plan.legNumber === 1;
      // Auto-complete PICKUP action for first return leg (courier already has package)
      const shouldAutoCompletePickup = isFirstReturnLeg && (plan.legType === 'PICKUP' || plan.legType === 'DIRECT');
      
      const returnLeg = await tx.shipmentLeg.create({
        data: {
          shipmentId: leg.shipmentId,
          legNumber: maxLegNumber + plan.legNumber,
          legType: plan.legType,
          originType: plan.originType,
          originAddress: plan.originAddress,
          originHubId: plan.originHubId,
          destType: plan.destType,
          destAddress: plan.destAddress,
          destHubId: plan.destHubId,
          // Auto-complete pickup action only - courier still needs to deliver
          status: shouldAutoCompletePickup ? 'IN_PROGRESS' : 'PENDING',
          courierId: shouldAutoCompletePickup ? courier.id : null,
          assignedAt: shouldAutoCompletePickup ? new Date() : null,
          pickedUpAt: shouldAutoCompletePickup ? new Date() : null,
          deliveredAt: null, // Courier must complete delivery
          note: shouldAutoCompletePickup
            ? `Return leg - Pickup auto-completed (courier already has package). Courier must deliver to complete this leg. Return shipping: ${returnShippingCost} BDT`
            : isFirstReturnLeg
            ? `Return leg - Delivery refused. Return shipping: ${returnShippingCost} BDT (sender pays return cost, not double)`
            : undefined,
        },
      });
      returnLegs.push(returnLeg);
    }

    // Find the next leg that needs action
    const nextActiveLeg = returnLegs.find(leg => leg.status === 'PENDING' || leg.status === 'IN_PROGRESS');
    
    // Set the next active leg as current
    await tx.shipment.update({
      where: { id: leg.shipmentId },
      data: { 
        status: 'IN_TRANSIT',
        currentLegId: nextActiveLeg ? nextActiveLeg.id : returnLegs[0].id,
      },
    });

    const autoCompletedNote = returnLegs[0]?.status === 'IN_PROGRESS' ? ' (first leg pickup auto-completed - courier has package, must deliver)' : '';
    
    await tx.shipmentEvent.create({
      data: {
        shipmentId: leg.shipmentId,
        status: 'IN_TRANSIT',
        updatedBy: userId,
        note: `Receiver refused delivery. ${returnLegs.length} return leg(s) created${autoCompletedNote}. Return shipping: ${returnShippingCost} BDT (sender pays return cost). ${reason || ''}`,
      },
    });

    await tx.notification.create({
      data: {
        shipmentId: leg.shipmentId,
        userId: leg.shipment.senderId,
        role: 'USER',
        message: `Delivery refused for shipment ${leg.shipment.trackingNumber}. Package is being returned. Return shipping cost: ${returnShippingCost} BDT.`,
      },
    });

    return { leg, returnLegs, returnShippingCost };
  }, {
    timeout: 10000, // Increase timeout to 10 seconds
  });
};

export const ShipmentLegService = {
  getAvailableLegs,
  getMyCourierLegs,
  acceptLeg,
  markLegPickedUp,
  markLegDelivered,
  getShipmentLegs,
  getAllLegs,
  assignCourierToLeg,
  releaseHubTransfer,
  confirmHubTransfer,
  markPickupRefused,
  markDeliveryRefused,
};
