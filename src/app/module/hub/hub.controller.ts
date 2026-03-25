import { Request, Response } from 'express';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { HubService } from './hub.service.js';
import status from 'http-status';
import { IQueryParams } from '../../interfaces/query.interface.js';

const createHub = catchAsync(async (req: Request, res: Response) => {
  const result = await HubService.createHub(req.body);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'Hub created successfully.',
    data: result,
  });
});

const getAllHubs = catchAsync(async (req: Request, res: Response) => {
  const result = await HubService.getAllHubs(req.query as IQueryParams);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Hubs fetched successfully.',
    data: result.data,
    meta: result.meta,
  });
});

const getHubById = catchAsync(async (req: Request, res: Response) => {
  const result = await HubService.getHubById(req.params.id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Hub fetched successfully.',
    data: result,
  });
});

const getHubsByCity = catchAsync(async (req: Request, res: Response) => {
  const result = await HubService.getHubsByCity(req.params.city as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Hubs fetched successfully.',
    data: result,
  });
});

const updateHub = catchAsync(async (req: Request, res: Response) => {
  const result = await HubService.updateHub(req.params.id as string, req.body);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Hub updated successfully.',
    data: result,
  });
});

const deleteHub = catchAsync(async (req: Request, res: Response) => {
  await HubService.deleteHub(req.params.id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Hub deleted successfully.',
  });
});

const getHubShipments = catchAsync(async (req: Request, res: Response) => {
  const result = await HubService.getHubShipments(req.params.id as string, req.query as IQueryParams);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Hub shipments fetched successfully.',
    data: result.data,
    meta: result.meta,
  });
});

const getHubCities = catchAsync(async (req: Request, res: Response) => {
  const result = await HubService.getHubCities();
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Hub cities fetched successfully.',
    data: result,
  });
});

export const HubController = {
  createHub,
  getAllHubs,
  getHubById,
  getHubsByCity,
  updateHub,
  deleteHub,
  getHubShipments,
  getHubCities,
};
