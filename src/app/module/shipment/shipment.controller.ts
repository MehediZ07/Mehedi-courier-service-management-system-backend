import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { ShipmentService } from './shipment.service.js';

const createShipment = catchAsync(async (req, res) => {
  const result = await ShipmentService.createShipment(req.user!.userId, req.user!.role, req.body);
  sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: 'Shipment created.', data: result });
});

const getAllShipments = catchAsync(async (req, res) => {
  const result = await ShipmentService.getAllShipments(req.query as Record<string, string>);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Shipments fetched.', data: result.data, meta: result.meta });
});

const getMyShipments = catchAsync(async (req, res) => {
  const result = await ShipmentService.getMyShipments(req.user!.userId, req.query as Record<string, string>);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'My shipments fetched.', data: result.data, meta: result.meta });
});

const getMyCourierShipments = catchAsync(async (req, res) => {
  const result = await ShipmentService.getMyCourierShipments(req.user!.userId, req.query as Record<string, string>);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Assigned shipments fetched.', data: result.data, meta: result.meta });
});

const getShipmentById = catchAsync(async (req, res) => {
  const result = await ShipmentService.getShipmentById(req.params.id as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Shipment fetched.', data: result });
});

const trackShipment = catchAsync(async (req, res) => {
  const result = await ShipmentService.trackShipment(req.params.trackingNumber as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Shipment tracked.', data: result });
});

const assignCourier = catchAsync(async (req, res) => {
  const result = await ShipmentService.assignCourier(req.params.id as string, req.body.courierId, req.user!.userId);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Courier assigned.', data: result });
});

const updateShipmentStatus = catchAsync(async (req, res) => {
  const result = await ShipmentService.updateShipmentStatus(req.params.id as string, req.user!.userId, req.body);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Shipment status updated.', data: result });
});

const getAvailableShipments = catchAsync(async (req, res) => {
  const result = await ShipmentService.getAvailableShipments(req.query as Record<string, string>);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Available shipments fetched.', data: result.data, meta: result.meta });
});

const acceptShipment = catchAsync(async (req, res) => {
  const result = await ShipmentService.acceptShipment(req.params.id as string, req.user!.userId);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Shipment accepted successfully.', data: result });
});

const cancelShipment = catchAsync(async (req, res) => {
  const result = await ShipmentService.cancelShipment(req.params.id as string, req.user!.userId, req.body.reason);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Shipment cancelled successfully.', data: result });
});

export const ShipmentController = {
  createShipment,
  getAllShipments,
  getMyShipments,
  getMyCourierShipments,
  getShipmentById,
  trackShipment,
  assignCourier,
  updateShipmentStatus,
  getAvailableShipments,
  acceptShipment,
  cancelShipment,
};
