import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { MerchantService } from './merchant.service.js';

const createMerchant = catchAsync(async (req, res) => {
  const result = await MerchantService.createMerchant(req.body);
  sendResponse(res, { httpStatusCode: status.CREATED, success: true, message: 'Merchant created.', data: result });
});

const getAllMerchants = catchAsync(async (req, res) => {
  const result = await MerchantService.getAllMerchants(req.query as Record<string, string>);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Merchants fetched.', data: result.data, meta: result.meta });
});

const getMerchantById = catchAsync(async (req, res) => {
  const result = await MerchantService.getMerchantById(req.params.id as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Merchant fetched.', data: result });
});

const getMyMerchantProfile = catchAsync(async (req, res) => {
  const result = await MerchantService.getMyMerchantProfile(req.user!.userId);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Merchant profile fetched.', data: result });
});

const getMySettlement = catchAsync(async (req, res) => {
  const result = await MerchantService.getMySettlement(req.user!.userId);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Settlement data fetched.', data: result });
});

const updateMerchant = catchAsync(async (req, res) => {
  const result = await MerchantService.updateMerchant(req.params.id as string, req.body);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Merchant updated.', data: result });
});

const deleteMerchant = catchAsync(async (req, res) => {
  await MerchantService.deleteMerchant(req.params.id as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Merchant deleted.' });
});

const getAllMerchantsWithPendingSettlement = catchAsync(async (req, res) => {
  const result = await MerchantService.getAllMerchantsWithPendingSettlement();
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Merchants with pending settlement fetched.', data: result });
});

const settleMerchantPayment = catchAsync(async (req, res) => {
  const result = await MerchantService.settleMerchantPayment(req.params.id as string, req.body.amount);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Merchant payment settled.', data: result });
});

export const MerchantController = { 
  createMerchant, 
  getAllMerchants, 
  getMerchantById, 
  getMyMerchantProfile,
  getMySettlement,
  updateMerchant, 
  deleteMerchant,
  getAllMerchantsWithPendingSettlement,
  settleMerchantPayment,
};
