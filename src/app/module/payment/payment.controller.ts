import status from 'http-status';
import { catchAsync } from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { PaymentService } from './payment.service';

const getAllPayments = catchAsync(async (req, res) => {
  const result = await PaymentService.getAllPayments(req.query as Record<string, string>);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Payments fetched.', data: result.data, meta: result.meta });
});

const getPaymentByShipmentId = catchAsync(async (req, res) => {
  const result = await PaymentService.getPaymentByShipmentId(req.params.shipmentId as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Payment fetched.', data: result });
});

const markPaymentAsPaid = catchAsync(async (req, res) => {
  const result = await PaymentService.markPaymentAsPaid(req.params.shipmentId as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Payment marked as paid.', data: result });
});

export const PaymentController = { getAllPayments, getPaymentByShipmentId, markPaymentAsPaid };
