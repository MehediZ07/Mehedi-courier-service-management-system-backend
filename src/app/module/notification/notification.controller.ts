import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { NotificationService } from './notification.service.js';

const getMyNotifications = catchAsync(async (req, res) => {
  const result = await NotificationService.getMyNotifications(req.user!.userId, req.query as Record<string, string>, req.user!.role);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Notifications fetched.', data: result.data, meta: result.meta });
});

const markAsRead = catchAsync(async (req, res) => {
  const result = await NotificationService.markAsRead(req.params.id as string, req.user!.userId, req.user!.role);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Notification marked as read.', data: result });
});

const markAllAsRead = catchAsync(async (req, res) => {
  const result = await NotificationService.markAllAsRead(req.user!.userId);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'All notifications marked as read.', data: { count: result.count } });
});

export const NotificationController = { getMyNotifications, markAsRead, markAllAsRead };
