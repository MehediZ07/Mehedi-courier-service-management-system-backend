import { z } from 'zod';

const markDeliveredSchema = z.object({
  proofOfDelivery: z.string().url().optional(),
  note: z.string().optional(),
});

export const ShipmentLegValidation = {
  markDelivered: markDeliveredSchema,
};
