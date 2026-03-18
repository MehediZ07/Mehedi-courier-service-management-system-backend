import z from 'zod';

const create = z.object({
  userId: z.string().uuid(),
  vehicleType: z.enum(['BIKE', 'BICYCLE', 'CAR', 'VAN', 'TRUCK']),
  licenseNumber: z.string().min(1),
});

const update = z.object({
  vehicleType: z.enum(['BIKE', 'BICYCLE', 'CAR', 'VAN', 'TRUCK']).optional(),
  licenseNumber: z.string().min(1).optional(),
  availability: z.boolean().optional(),
});

const approveReject = z.object({
  approvalStatus: z.enum(['APPROVED', 'REJECTED']),
});

export const CourierValidation = { create, update, approveReject };
