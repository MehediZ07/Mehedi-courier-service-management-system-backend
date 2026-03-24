import status from 'http-status';
import AppError from '../../errorHelpers/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { IQueryParams } from '../../interfaces/query.interface.js';
import { Role, UserStatus } from '@prisma/client';
import { deleteFileFromCloudinary } from '../../config/cloudinary.config.js';

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
    select: { id: true, name: true, email: true, role: true, phone: true, profileImage: true, status: true, createdAt: true },
  });
  if (!user) throw new AppError(status.NOT_FOUND, 'User not found.');
  return user;
};

const updateUser = async (id: string, payload: { name?: string; phone?: string; profileImage?: string }) => {
  return prisma.user.update({
    where: { id },
    data: payload,
    select: { id: true, name: true, email: true, role: true, phone: true, profileImage: true, status: true },
  });
};

const updateUserProfileImage = async (id: string, imageUrl: string, oldImageUrl?: string) => {
  if (oldImageUrl) {
    await deleteFileFromCloudinary(oldImageUrl);
  }

  return prisma.user.update({
    where: { id },
    data: { profileImage: imageUrl },
    select: { id: true, name: true, email: true, profileImage: true },
  });
};

const updateStatus = async (id: string, userStatus: UserStatus) => {
  return prisma.user.update({ where: { id }, data: { status: userStatus }, select: { id: true, email: true, status: true } });
};

const updateRole = async (id: string, role: Role) => {
  return prisma.user.update({ where: { id }, data: { role }, select: { id: true, email: true, role: true } });
};

const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.profileImage) {
    await deleteFileFromCloudinary(user.profileImage);
  }
  await prisma.user.delete({ where: { id } });
};

export const UserService = { getAllUsers, getUserById, updateUser, updateUserProfileImage, updateStatus, updateRole, deleteUser };
