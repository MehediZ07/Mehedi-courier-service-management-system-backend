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
    return !siblings.some(
      (s) => s.legNumber < leg.legNumber && s.status !== 'COMPLETED',
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

  const leg = await prisma.shipmentLeg.findUnique({ where: { id: legId }, include: { shipment: { include: { pricing: true, payment: true } } } });
  if (!leg) throw new AppError(status.NOT_FOUND, 'Leg not found.');
  if (leg.courierId !== courier.id) throw new AppError(status.FORBIDDEN, 'This leg is not assigned to you.');
  if (leg.status !== 'IN_PROGRESS') throw new AppError(status.BAD_REQUEST, 'Leg must be in IN_PROGRESS status.');

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
    const totalLegs = await tx.shipmentLeg.count({ where: { shipmentId: leg.shipmentId } });
    const isLastLeg = leg.legNumber === totalLegs;
    const isCOD = leg.shipment.payment?.method === 'COD';
    const isDeliveryLeg = leg.legType === 'DELIVERY' || leg.legType === 'DIRECT';
    const hasProductPrice = leg.shipment.productPrice && leg.shipment.productPrice > 0;

    // Calculate courier earning (10% of total price divided by number of legs)
    const earning = leg.shipment.pricing ? (leg.shipment.pricing.totalPrice * 0.1) / totalLegs : 0;

    // Handle cash collection on final delivery
    let codAmount = 0;
    if (isDeliveryLeg && isLastLeg) {
      if (isCOD) {
        // COD = product price + shipment charge
        const productPrice = leg.shipment.productPrice || 0;
        const shipmentCharge = leg.shipment.pricing?.totalPrice || 0;
        codAmount = productPrice + shipmentCharge;
      } else if (hasProductPrice) {
        // Stripe payment but has product price - collect only product price
        codAmount = leg.shipment.productPrice || 0;
      }
    }

    const updatedLeg = await tx.shipmentLeg.update({
      where: { id: legId },
      data: {
        status: 'COMPLETED',
        deliveredAt: new Date(),
        courierEarning: earning,
        codCollected: isCOD && isDeliveryLeg && isLastLeg,
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

    // Update merchant pending settlement (product price - 1.85% commission)
    if (isLastLeg && leg.shipment.merchantId && leg.shipment.productPrice > 0) {
      const merchantAmount = leg.shipment.productPrice * 0.9815; // 100% - 1.85%
      await tx.merchant.update({
        where: { id: leg.shipment.merchantId },
        data: {
          pendingSettlement: { increment: merchantAmount },
        },
      });
    }

    if (isLastLeg) {
      await tx.shipment.update({
        where: { id: leg.shipmentId },
        data: {
          status: 'DELIVERED',
          proofOfDelivery,
          paymentStatus: isCOD ? 'PAID' : leg.shipment.paymentStatus,
        },
      });

      if (isCOD) {
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
    include: { shipment: true },
  });

  if (legs.length === 0) throw new AppError(status.NOT_FOUND, 'No legs found.');
  
  for (const leg of legs) {
    if (leg.legType !== 'HUB_TRANSFER') throw new AppError(status.BAD_REQUEST, 'Only HUB_TRANSFER legs can be released.');
    if (leg.status !== 'PENDING') throw new AppError(status.BAD_REQUEST, `Leg ${leg.id} is not in PENDING status.`);
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

  return prisma.$transaction(async (tx) => {
    await tx.shipmentLeg.update({
      where: { id: legId },
      data: {
        status: 'FAILED',
        note: `Delivery refused by receiver. Reason: ${reason || 'Not specified'}`,
      },
    });

    // Return shipping cost = same as original shipment charge (sender pays once, not double)
    const returnShippingCost = leg.shipment.pricing?.totalPrice || 0;
    const maxLegNumber = Math.max(...leg.shipment.legs.map(l => l.legNumber));
    
    // Use route planning to create proper return legs
    const regionType = detectRegionType(leg.shipment.deliveryCity, leg.shipment.pickupCity);
    const returnLegPlans = await planShipmentRoute({
      pickupAddress: leg.shipment.deliveryAddress,
      pickupCity: leg.shipment.deliveryCity,
      deliveryAddress: leg.shipment.pickupAddress,
      deliveryCity: leg.shipment.pickupCity,
      weight: leg.shipment.weight,
      priority: leg.shipment.priority as 'STANDARD' | 'EXPRESS',
      regionType,
    });

    // Create return legs with proper routing
    const returnLegs = [];
    for (const plan of returnLegPlans) {
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
          status: 'PENDING',
          note: plan.legNumber === 1 
            ? `Return leg - Delivery refused. Return shipping: ${returnShippingCost} BDT (sender pays return cost, not double)`
            : undefined,
        },
      });
      returnLegs.push(returnLeg);
    }

    // Set first return leg as current
    await tx.shipment.update({
      where: { id: leg.shipmentId },
      data: { 
        status: 'IN_TRANSIT',
        currentLegId: returnLegs[0].id,
      },
    });

    await tx.shipmentEvent.create({
      data: {
        shipmentId: leg.shipmentId,
        status: 'IN_TRANSIT',
        updatedBy: userId,
        note: `Receiver refused delivery. ${returnLegs.length} return leg(s) created. Return shipping: ${returnShippingCost} BDT (sender pays return cost). ${reason || ''}`,
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
