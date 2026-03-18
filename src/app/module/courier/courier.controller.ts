import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { CourierService } from './courier.service';

const createCourier = catchAsync(async (req, res) => {
  const result = await CourierService.createCourier(req.body);
  sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: 'Courier created.', data: result });
});

const getAllCouriers = catchAsync(async (req, res) => {
  const result = await CourierService.getAllCouriers(req.query as Record<string, string>);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Couriers fetched.', data: result.data, meta: result.meta });
});

const getCourierById = catchAsync(async (req, res) => {
  const result = await CourierService.getCourierById(req.params.id as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Courier fetched.', data: result });
});

const getMyCourierProfile = catchAsync(async (req, res) => {
  const result = await CourierService.getMyCourierProfile(req.user!.userId);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Courier profile fetched.', data: result });
});

const updateCourier = catchAsync(async (req, res) => {
  const result = await CourierService.updateCourier(req.params.id as string, req.body);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Courier updated.', data: result });
});

const deleteCourier = catchAsync(async (req, res) => {
  await CourierService.deleteCourier(req.params.id as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Courier deleted.' });
});

const approveCourier = catchAsync(async (req, res) => {
  const result = await CourierService.approveCourier(req.params.id as string, req.body.approvalStatus);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Courier approval status updated.', data: result });
});

const toggleAvailability = catchAsync(async (req, res) => {
  const result = await CourierService.toggleAvailability(req.user!.userId);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Availability toggled.', data: result });
});

export const CourierController = { createCourier, getAllCouriers, getCourierById, getMyCourierProfile, updateCourier, deleteCourier, approveCourier, toggleAvailability };
