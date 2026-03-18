import z from 'zod';

const register = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(['USER', 'MERCHANT']).optional().default('USER'),
});

const registerCourier = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(1),
  vehicleType: z.enum(['BIKE', 'BICYCLE', 'CAR', 'VAN', 'TRUCK']),
  licenseNumber: z.string().min(1),
});

const login = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePassword = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const AuthValidation = { register, registerCourier, login, changePassword };
