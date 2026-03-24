import { prisma } from '../../lib/prisma.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

const getMyNotifications = async (userId: string, queryParams: IQueryParams, userRole?: string) => {
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  
  return new QueryBuilder(prisma.notification, queryParams, {
    filterableFields: ['readStatus'],
  })
    .filter()
    .sort()
    .paginate()
    .where(isAdmin ? {} : { userId })
    .include({ shipment: { select: { trackingNumber: true, status: true } }, user: { select: { name: true, email: true } } })
    .execute();
};

const markAsRead = async (id: string, userId: string) => {
  return prisma.notification.updateMany({ where: { id, userId }, data: { readStatus: true } });
};

const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({ where: { userId, readStatus: false }, data: { readStatus: true } });
};

export const NotificationService = { getMyNotifications, markAsRead, markAllAsRead };
