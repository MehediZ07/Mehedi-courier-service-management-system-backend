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

export const ShipmentLegController = {
  getAvailableLegs,
  getMyCourierLegs,
  acceptLeg,
  markLegPickedUp,
  markLegDelivered,
  getShipmentLegs,
};
