import bcrypt from 'bcryptjs';
import status from 'http-status';
import AppError from '../../errorHelpers/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { jwtUtils } from '../../utils/jwt.js';
import { envVars } from '../../config/env.js';
import { Role } from '@prisma/client';

const register = async (payload: { name: string; email: string; password: string; phone?: string; role?: 'USER' | 'MERCHANT' }) => {
  const existing = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
  if (existing) throw new AppError(status.CONFLICT, 'Email already registered.');

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: hashedPassword,
      phone: payload.phone,
      role: (payload.role as Role) ?? Role.USER,
    },
    select: { id: true, name: true, email: true, role: true, phone: true, status: true, createdAt: true },
  });

  return user;
};

const registerCourier = async (payload: { name: string; email: string; password: string; phone: string; vehicleType: string; licenseNumber: string }) => {
  const existing = await prisma.user.findUnique({ where: { email: payload.email.toLowerCase() } });
  if (existing) throw new AppError(status.CONFLICT, 'Email already registered.');

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email.toLowerCase(),
        password: hashedPassword,
        phone: payload.phone,
        role: Role.COURIER,
      },
    });

    const courier = await tx.courier.create({
      data: {
        userId: user.id,
        vehicleType: payload.vehicleType as any,
        licenseNumber: payload.licenseNumber,
        approvalStatus: 'PENDING',
        availability: false,
      },
      include: { user: { select: { id: true, name: true, email: true, phone: true, role: true, status: true } } },
    });

    return courier;
  });

  return result;
};

const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new AppError(status.UNAUTHORIZED, 'Invalid email or password.');

  if (user.status !== 'ACTIVE') throw new AppError(status.FORBIDDEN, 'Your account is suspended or inactive.');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError(status.UNAUTHORIZED, 'Invalid email or password.');

  const accessToken = jwtUtils.createToken(
    { userId: user.id, email: user.email, role: user.role },
    envVars.ACCESS_TOKEN_SECRET,
    { expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN as `${number}${'s'|'m'|'h'|'d'}` },
  );

  const refreshToken = jwtUtils.createToken(
    { userId: user.id, email: user.email, role: user.role },
    envVars.REFRESH_TOKEN_SECRET,
    { expiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN as `${number}${'s'|'m'|'h'|'d'}` },
  );

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
  };
};

const refreshToken = async (token: string) => {
  const verified = jwtUtils.verifyToken(token, envVars.REFRESH_TOKEN_SECRET);
  if (!verified.success || !verified.data) throw new AppError(status.UNAUTHORIZED, 'Invalid or expired refresh token.');

  const user = await prisma.user.findUnique({ where: { id: verified.data.userId as string } });
  if (!user || user.status !== 'ACTIVE') throw new AppError(status.UNAUTHORIZED, 'User not found or inactive.');

  const accessToken = jwtUtils.createToken(
    { userId: user.id, email: user.email, role: user.role },
    envVars.ACCESS_TOKEN_SECRET,
    { expiresIn: envVars.ACCESS_TOKEN_EXPIRES_IN as `${number}${'s'|'m'|'h'|'d'}` },
  );

  return { accessToken };
};

const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(status.NOT_FOUND, 'User not found.');

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new AppError(status.UNAUTHORIZED, 'Old password is incorrect.');

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
};

const getMe = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, phone: true, status: true, createdAt: true },
  });
};

export const AuthService = { register, registerCourier, login, refreshToken, changePassword, getMe };
