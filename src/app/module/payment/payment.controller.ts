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

const initiateStripePayment = catchAsync(async (req, res) => {
  const { amount } = req.body;
  const user = await req.app.get('prisma').user.findUnique({ where: { id: req.user!.userId } });

  const result = await PaymentService.initiateStripePayment(req.params.shipmentId as string, amount, user.email);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Payment initiated.', data: result });
});

const confirmStripePayment = catchAsync(async (req, res) => {
  const { paymentIntentId } = req.body;
  const result = await PaymentService.confirmStripePayment(paymentIntentId);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Payment confirmed.', data: result });
});

const markPaymentAsPaid = catchAsync(async (req, res) => {
  const result = await PaymentService.markPaymentAsPaid(req.params.shipmentId as string);
  sendResponse(res, { httpStatusCode: status.OK, success: true, message: 'Payment marked as paid.', data: result });
});

export const PaymentController = { getAllPayments, getPaymentByShipmentId, initiateStripePayment, confirmStripePayment, markPaymentAsPaid };
