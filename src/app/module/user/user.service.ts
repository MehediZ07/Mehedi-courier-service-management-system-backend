import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { IQueryParams } from '../../interfaces/query.interface';
import { Role, UserStatus } from '../../generated/prisma';

const getAllUsers = async (queryParams: IQueryParams) => {
  return new QueryBuilder(prisma.user, queryParams, {
    searchableFields: ['name', 'email', 'phone'],
    filterableFields: ['role', 'status'],
  })
    .search()
    .filter()
    .sort()
    .paginate()
    .execute();
};

const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, phone: true, status: true, createdAt: true },
  });
  if (!user) throw new AppError(status.NOT_FOUND, 'User not found.');
  return user;
};

const updateUser = async (id: string, payload: { name?: string; phone?: string }) => {
  return prisma.user.update({
    where: { id },
    data: payload,
    select: { id: true, name: true, email: true, role: true, phone: true, status: true },
  });
};

const updateStatus = async (id: string, userStatus: UserStatus) => {
  return prisma.user.update({ where: { id }, data: { status: userStatus }, select: { id: true, email: true, status: true } });
};

const updateRole = async (id: string, role: Role) => {
  return prisma.user.update({ where: { id }, data: { role }, select: { id: true, email: true, role: true } });
};

const deleteUser = async (id: string) => {
  await prisma.user.delete({ where: { id } });
};

export const UserService = { getAllUsers, getUserById, updateUser, updateStatus, updateRole, deleteUser };
