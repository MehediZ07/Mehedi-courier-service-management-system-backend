import z from 'zod';

const upsertPricing = z.object({
  regionType: z.enum(['LOCAL', 'NATIONAL', 'INTERNATIONAL']),
  basePrice: z.number().positive(),
  perKgPrice: z.number().positive(),
  expressMult: z.number().min(1).optional(),
});

const calculatePrice = z.object({
  pickupCity: z.string().min(1),
  deliveryCity: z.string().min(1),
  weight: z.number().positive(),
  priority: z.enum(['STANDARD', 'EXPRESS']).optional().default('STANDARD'),
});

export const PricingValidation = { upsertPricing, calculatePrice };
