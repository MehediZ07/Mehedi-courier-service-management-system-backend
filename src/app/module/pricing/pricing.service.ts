import status from 'http-status';
import AppError from '../../errorHelpers/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { Priority, RegionType } from '@prisma/client';

// Simple rule: same city = LOCAL, same country different city = NATIONAL
// For INTERNATIONAL the client must explicitly pass regionType override (future)
export const detectRegionType = (pickupCity: string, deliveryCity: string): RegionType => {
  if (pickupCity.trim().toLowerCase() === deliveryCity.trim().toLowerCase()) return RegionType.LOCAL;
  return RegionType.NATIONAL;
};

export const computePrice = (
  pricing: { basePrice: number; perKgPrice: number; expressMult: number },
  weight: number,
  priority: Priority,
) => {
  const base = pricing.basePrice;
  const weightCharge = weight * pricing.perKgPrice;
  const subtotal = base + weightCharge;
  const priorityCharge = priority === Priority.EXPRESS ? subtotal * (pricing.expressMult - 1) : 0;
  const totalPrice = subtotal + priorityCharge;
  return { basePrice: base, weightCharge, priorityCharge, totalPrice };
};

const getAllPricing = async () => prisma.pricing.findMany({ orderBy: { regionType: 'asc' } });

const upsertPricing = async (payload: {
  regionType: RegionType;
  basePrice: number;
  perKgPrice: number;
  expressMult?: number;
}) => {
  return prisma.pricing.upsert({
    where: { regionType: payload.regionType },
    update: {
      basePrice: payload.basePrice,
      perKgPrice: payload.perKgPrice,
      ...(payload.expressMult && { expressMult: payload.expressMult }),
    },
    create: {
      regionType: payload.regionType,
      basePrice: payload.basePrice,
      perKgPrice: payload.perKgPrice,
      expressMult: payload.expressMult ?? 1.2,
    },
  });
};

const calculatePrice = async (payload: {
  pickupCity: string;
  deliveryCity: string;
  weight: number;
  priority: Priority;
}) => {
  const regionType = detectRegionType(payload.pickupCity, payload.deliveryCity);
  const pricing = await prisma.pricing.findUnique({ where: { regionType } });
  if (!pricing) throw new AppError(status.NOT_FOUND, `No pricing configured for region: ${regionType}`);

  const breakdown = computePrice(pricing, payload.weight, payload.priority);
  return { regionType, ...breakdown };
};

export const PricingService = { getAllPricing, upsertPricing, calculatePrice };
