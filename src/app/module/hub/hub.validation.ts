import { z } from 'zod';

const createHubSchema = z.object({
  name: z.string().min(3, 'Hub name must be at least 3 characters'),
  city: z.string().min(2, 'City name is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  hubType: z.enum(['LOCAL', 'REGIONAL', 'INTERNATIONAL']).optional(),
});

const updateHubSchema = z.object({
  name: z.string().min(3).optional(),
  address: z.string().min(5).optional(),
  hubType: z.enum(['LOCAL', 'REGIONAL', 'INTERNATIONAL']).optional(),
  isActive: z.boolean().optional(),
});

export const HubValidation = {
  create: createHubSchema,
  update: updateHubSchema,
};
