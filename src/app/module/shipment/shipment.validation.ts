import z from 'zod';

const create = z.object({
  pickupAddress: z.string().min(5),
  deliveryAddress: z.string().min(5),
  packageType: z.string().min(1),
  weight: z.number().positive(),
  priority: z.enum(['STANDARD', 'EXPRESS']).optional().default('STANDARD'),
  paymentMethod: z.enum(['STRIPE', 'SSLCOMMERZ', 'COD']),
  amount: z.number().positive(),
  note: z.string().optional(),
});

const assignCourier = z.object({
  courierId: z.string().uuid(),
});

const updateStatus = z.object({
  status: z.enum(['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED']),
  note: z.string().optional(),
  proofOfDelivery: z.string().optional(),
});

export const ShipmentValidation = { create, assignCourier, updateStatus };
