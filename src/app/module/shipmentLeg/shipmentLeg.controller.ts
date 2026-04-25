import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { ShipmentLegService } from './shipmentLeg.service.js';
import status from 'http-status';
import { IQueryParams } from '../../interfaces/query.interface.js';

const getAvailableLegs = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentLegService.getAvailableLegs(req.user!.userId, req.query as IQueryParams);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Available legs fetched successfully.',
    data: result.data,
    meta: result.meta,
  });
});

const getMyCourierLegs = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentLegService.getMyCourierLegs(req.user!.userId, req.query as IQueryParams);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'My legs fetched successfully.',
    data: result.data,
    meta: result.meta,
  });
});

const acceptLeg = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentLegService.acceptLeg(req.params.id as string, req.user!.userId);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Leg accepted successfully.',
    data: result,
  });
});

const markLegPickedUp = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentLegService.markLegPickedUp(req.params.id as string, req.user!.userId);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Leg marked as picked up.',
    data: result,
  });
});

const markLegDelivered = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentLegService.markLegDelivered(req.params.id as string, req.user!.userId, req.body.proofOfDelivery);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Leg marked as delivered.',
    data: result,
  });
});

const getShipmentLegs = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentLegService.getShipmentLegs(req.params.shipmentId as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Shipment legs fetched successfully.',
    data: result,
  });
});

const getAllLegs = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentLegService.getAllLegs(req.query as IQueryParams);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'All legs fetched successfully.',
    data: result.data,
    meta: result.meta,
  });
});

const assignCourierToLeg = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentLegService.assignCourierToLeg(req.params.id as string, req.body.courierId);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Courier assigned to leg successfully.',
    data: result,
  });
});

const releaseHubTransfer = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentLegService.releaseHubTransfer(req.body.legIds, req.body.note);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Hub transfer released successfully.',
    data: result,
  });
});

const confirmHubTransfer = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentLegService.confirmHubTransfer(req.body.legIds, req.body.note);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Hub transfer confirmed successfully.',
    data: result,
  });
});

const markPickupRefused = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentLegService.markPickupRefused(req.params.id as string, req.user!.userId, req.body.reason);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Pickup refusal recorded. Shipment marked as RETURNED.',
    data: result,
  });
});

const markDeliveryRefused = catchAsync(async (req: Request, res: Response) => {
  const result = await ShipmentLegService.markDeliveryRefused(req.params.id as string, req.user!.userId, req.body.reason);
  
  const message = result.returnLegs.length > 0
    ? 'Delivery refusal recorded. Return legs created.'
    : 'Return delivery refused. Package stored at hub.';
  
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message,
    data: result,
  });
});

export const ShipmentLegController = {
  getAvailableLegs,
  getMyCourierLegs,
  acceptLeg,
  markLegPickedUp,
  markLegDelivered,
  getShipmentLegs,
  getAllLegs,
  assignCourierToLeg,
  releaseHubTransfer,
  confirmHubTransfer,
  markPickupRefused,
  markDeliveryRefused,
};
