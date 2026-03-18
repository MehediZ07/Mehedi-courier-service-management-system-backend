import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { NotificationService } from './notification.service';

const getMyNotifications = catchAsync(async (req, res) => {
  const result = await NotificationService.getMyNotifications(req.user!.userId, req.query as Record<string, string>);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Notifications fetched.', data: result.data, meta: result.meta });
});

const markAsRead = catchAsync(async (req, res) => {
  await NotificationService.markAsRead(req.params.id as string, req.user!.userId);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Notification marked as read.' });
});

const markAllAsRead = catchAsync(async (req, res) => {
  await NotificationService.markAllAsRead(req.user!.userId);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'All notifications marked as read.' });
});

export const NotificationController = { getMyNotifications, markAsRead, markAllAsRead };
