import status from 'http-status';
import AppError from '../../errorHelpers/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

const createMerchant = async (payload: { userId: string; companyName: string; address?: string }) => {
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new AppError(status.NOT_FOUND, 'User not found.');

  const existing = await prisma.merchant.findUnique({ where: { userId: payload.userId } });
  if (existing) throw new AppError(status.CONFLICT, 'Merchant profile already exists for this user.');

  await prisma.user.update({ where: { id: payload.userId }, data: { role: 'MERCHANT' } });

  return prisma.merchant.create({
    data: payload,
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
};

const getAllMerchants = async (queryParams: IQueryParams) => {
  return new QueryBuilder(prisma.merchant, queryParams, {
    searchableFields: ['companyName', 'user.name', 'user.email'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({ user: { select: { id: true, name: true, email: true, phone: true, status: true } } })
    .execute();
};

const getMerchantById = async (id: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true, phone: true, status: true } } },
  });
  if (!merchant) throw new AppError(status.NOT_FOUND, 'Merchant not found.');
  return merchant;
};

const getMyMerchantProfile = async (userId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });
  if (!merchant) throw new AppError(status.NOT_FOUND, 'Merchant profile not found.');
  return merchant;
};

const updateMerchant = async (id: string, payload: { companyName?: string; address?: string }) => {
  return prisma.merchant.update({
    where: { id },
    data: payload,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
};

const deleteMerchant = async (id: string) => {
  await prisma.merchant.delete({ where: { id } });
};

export const MerchantService = { createMerchant, getAllMerchants, getMerchantById, getMyMerchantProfile, updateMerchant, deleteMerchant };
