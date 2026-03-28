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

const getMySettlement = async (userId: string) => {
  const merchant = await prisma.merchant.findUnique({ where: { userId } });
  if (!merchant) throw new AppError(status.NOT_FOUND, 'Merchant profile not found.');

  return {
    pendingSettlement: merchant.pendingSettlement,
    totalSettled: 0,
    transactions: [],
  };
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

const getAllMerchantsWithPendingSettlement = async () => {
  return prisma.merchant.findMany({
    where: { pendingSettlement: { gt: 0 } },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    orderBy: { pendingSettlement: 'desc' },
  });
};

const settleMerchantPayment = async (merchantId: string, amount: number) => {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) throw new AppError(status.NOT_FOUND, 'Merchant not found.');
  if (merchant.pendingSettlement < amount) throw new AppError(status.BAD_REQUEST, 'Settlement amount exceeds pending balance.');

  return prisma.merchant.update({
    where: { id: merchantId },
    data: { pendingSettlement: { decrement: amount } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
};

export const MerchantService = { 
  createMerchant, 
  getAllMerchants, 
  getMerchantById, 
  getMyMerchantProfile,
  getMySettlement,
  updateMerchant, 
  deleteMerchant,
  getAllMerchantsWithPendingSettlement,
  settleMerchantPayment,
};
