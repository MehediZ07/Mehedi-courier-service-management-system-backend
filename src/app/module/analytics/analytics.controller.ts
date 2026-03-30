import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { AnalyticsService } from './analytics.service.js';

const trackVisit = catchAsync(async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const { page } = req.body;
  
  const visitData: any = { ip, userAgent, page };
  
  if (req.user) {
    visitData.userId = req.user.userId;
    visitData.userEmail = req.user.email;
    visitData.userName = req.user.name;
    visitData.userRole = req.user.role;
  }
  
  await AnalyticsService.trackVisit(visitData);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Visit tracked.' });
});

const getAnalytics = catchAsync(async (req, res) => {
  const result = await AnalyticsService.getAnalytics();
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Analytics fetched.', data: result });
});

const getAllVisits = catchAsync(async (req, res) => {
  const result = await AnalyticsService.getAllVisits(req.query);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Visits fetched.', data: result.data, meta: result.meta });
});

export const AnalyticsController = { trackVisit, getAnalytics, getAllVisits };
