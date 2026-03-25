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

const markAsRead = async (id: string, userId: string, userRole?: string) => {
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
  
  // First verify the notification exists
  const notification = await prisma.notification.findUnique({ where: { id } });
  
  if (!notification) {
    throw new Error('Notification not found');
  }
  
  // Check if user has permission (either owns it or is admin)
  if (!isAdmin && notification.userId !== userId) {
    throw new Error('You do not have permission to mark this notification as read');
  }
  
  // Update and return the notification
  const updated = await prisma.notification.update({ 
    where: { id }, 
    data: { readStatus: true },
    include: { 
      shipment: { select: { trackingNumber: true, status: true } },
      user: { select: { name: true, email: true } }
    }
  });
  
  return updated;
};

const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({ where: { userId, readStatus: false }, data: { readStatus: true } });
};

export const NotificationService = { getMyNotifications, markAsRead, markAllAsRead };
