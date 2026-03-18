import z from 'zod';

const create = z.object({
  userId: z.string().uuid(),
  companyName: z.string().min(2),
  address: z.string().optional(),
});

const update = z.object({
  companyName: z.string().min(2).optional(),
  address: z.string().optional(),
});

export const MerchantValidation = { create, update };
