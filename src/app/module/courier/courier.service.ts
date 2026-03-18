import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { IQueryParams } from '../../interfaces/query.interface';
import { VehicleType } from '../../generated/prisma';

const createCourier = async (payload: { userId: string; vehicleType: VehicleType; licenseNumber: string }) => {
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new AppError(status.NOT_FOUND, 'User not found.');

  const existing = await prisma.courier.findUnique({ where: { userId: payload.userId } });
  if (existing) throw new AppError(status.CONFLICT, 'Courier profile already exists for this user.');

  await prisma.user.update({ where: { id: payload.userId }, data: { role: 'COURIER' } });

  return prisma.courier.create({
    data: payload,
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
};

const getAllCouriers = async (queryParams: IQueryParams) => {
  return new QueryBuilder(prisma.courier, queryParams, {
    searchableFields: ['licenseNumber', 'user.name', 'user.email'],
    filterableFields: ['vehicleType', 'availability'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({ user: { select: { id: true, name: true, email: true, phone: true, status: true } } })
    .execute();
};

const getCourierById = async (id: string) => {
  const courier = await prisma.courier.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true, phone: true, status: true } } },
  });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier not found.');
  return courier;
};

const getMyCourierProfile = async (userId: string) => {
  const courier = await prisma.courier.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (!courier) throw new AppError(status.NOT_FOUND, 'Courier profile not found.');
  return courier;
};

const updateCourier = async (id: string, payload: { vehicleType?: VehicleType; licenseNumber?: string; availability?: boolean }) => {
  return prisma.courier.update({
    where: { id },
    data: payload,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
};

const deleteCourier = async (id: string) => {
  await prisma.courier.delete({ where: { id } });
};

export const CourierService = { createCourier, getAllCouriers, getCourierById, getMyCourierProfile, updateCourier, deleteCourier };
