import z from 'zod';

const create = z.object({
  pickupAddress: z.string().min(5),
  pickupCity: z.string().min(1),
  pickupPhone: z.string().min(10),
  deliveryAddress: z.string().min(5),
  deliveryCity: z.string().min(1),
  deliveryPhone: z.string().min(10),
  packageType: z.string().min(1),
  weight: z.number().positive(),
  productPrice: z.number().nonnegative().optional(),
  priority: z.enum(['STANDARD', 'EXPRESS']).optional().default('STANDARD'),
  paymentMethod: z.enum(['STRIPE', 'COD']),
  note: z.string().optional(),
});

const assignCourier = z.object({
  courierId: z.string().min(1),
});

const updateStatus = z.object({
  status: z.enum(['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED']),
  note: z.string().optional(),
  proofOfDelivery: z.string().optional(),
});

export const ShipmentValidation = { create, assignCourier, updateStatus };
