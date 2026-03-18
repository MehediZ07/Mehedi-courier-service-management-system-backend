import z from 'zod';

const updateUser = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  profileImage: z.string().optional(),
});

const updateStatus = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});

const updateRole = z.object({
  role: z.enum(['ADMIN', 'COURIER', 'MERCHANT', 'USER']),
});

export const UserValidation = { updateUser, updateStatus, updateRole };
