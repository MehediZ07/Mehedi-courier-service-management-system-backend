import { prisma } from '../../lib/prisma.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { IQueryParams } from '../../interfaces/query.interface.js';

const getMyNotifications = async (userId: string, queryParams: IQueryParams) => {
  return new QueryBuilder(prisma.notification, queryParams, {
    filterableFields: ['readStatus'],
  })
    .filter()
    .sort()
    .paginate()
    .where({ userId })
    .include({ shipment: { select: { trackingNumber: true, status: true } } })
    .execute();
};

const markAsRead = async (id: string, userId: string) => {
  return prisma.notification.updateMany({ where: { id, userId }, data: { readStatus: true } });
};

const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({ where: { userId, readStatus: false }, data: { readStatus: true } });
};

export const NotificationService = { getMyNotifications, markAsRead, markAllAsRead };
