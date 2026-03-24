import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { PricingService } from './pricing.service.js';
import { Priority } from '@prisma/client';

const getAllPricing = catchAsync(async (_req, res) => {
  const result = await PricingService.getAllPricing();
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Pricing fetched.', data: result });
});

const upsertPricing = catchAsync(async (req, res) => {
  const result = await PricingService.upsertPricing(req.body);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Pricing saved.', data: result });
});

const calculatePrice = catchAsync(async (req, res) => {
  const result = await PricingService.calculatePrice({
    pickupCity: req.body.pickupCity,
    deliveryCity: req.body.deliveryCity,
    weight: req.body.weight,
    priority: (req.body.priority ?? 'STANDARD') as Priority,
  });
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Price calculated.', data: result });
});

export const PricingController = { getAllPricing, upsertPricing, calculatePrice };
