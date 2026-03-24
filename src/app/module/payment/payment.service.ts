import status from 'http-status';
import AppError from '../../errorHelpers/AppError.js';
import { prisma } from '../../lib/prisma.js';
import { QueryBuilder } from '../../utils/QueryBuilder.js';
import { IQueryParams } from '../../interfaces/query.interface.js';
import { stripe } from '../../config/stripe.config.js';

const getAllPayments = async (queryParams: IQueryParams) => {
  return new QueryBuilder(prisma.payment, queryParams, {
    filterableFields: ['status', 'method'],
  })
    .filter()
    .sort()
    .paginate()
    .include({ shipment: { select: { trackingNumber: true, senderId: true, deliveryAddress: true } } })
    .execute();
};

const getPaymentByShipmentId = async (shipmentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { shipmentId },
    include: { shipment: { select: { trackingNumber: true, status: true } } },
  });
  if (!payment) throw new AppError(status.NOT_FOUND, 'Payment not found.');
  return payment;
};

const initiateStripePayment = async (shipmentId: string, amount: number, email: string) => {
  const payment = await prisma.payment.findUnique({ where: { shipmentId } });
  if (!payment) throw new AppError(status.NOT_FOUND, 'Payment not found.');
  if (payment.status === 'PAID') throw new AppError(status.BAD_REQUEST, 'Payment already completed.');

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'bdt',
            product_data: {
              name: 'Shipment Delivery Fee',
              description: `Shipment ID: ${shipmentId}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      customer_email: email,
      metadata: { shipmentId },
    });

    await prisma.payment.update({
      where: { shipmentId },
      data: { transactionId: session.id },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error: any) {
    throw new AppError(status.BAD_REQUEST, `Stripe error: ${error.message}`);
  }
};

const confirmStripePayment = async (sessionId: string) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const shipmentId = session.metadata?.shipmentId;
      if (!shipmentId) throw new AppError(status.BAD_REQUEST, 'Invalid session metadata.');
      
      const payment = await prisma.payment.findUnique({ where: { shipmentId } });

      if (payment) {
        return await prisma.$transaction(async (tx) => {
          const updated = await tx.payment.update({
            where: { shipmentId },
            data: { status: 'PAID' },
          });
          await tx.shipment.update({ where: { id: shipmentId }, data: { paymentStatus: 'PAID' } });
          return updated;
        });
      }
    }

    throw new AppError(status.BAD_REQUEST, 'Payment not succeeded.');
  } catch (error: any) {
    throw new AppError(status.BAD_REQUEST, `Stripe error: ${error.message}`);
  }
};

const markPaymentAsPaid = async (shipmentId: string) => {
  const payment = await prisma.payment.findUnique({ where: { shipmentId } });
  if (!payment) throw new AppError(status.NOT_FOUND, 'Payment not found.');
  if (payment.status === 'PAID') throw new AppError(status.BAD_REQUEST, 'Payment already marked as paid.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { shipmentId },
      data: { status: 'PAID' },
    });
    await tx.shipment.update({ where: { id: shipmentId }, data: { paymentStatus: 'PAID' } });
    return updated;
  });
};

export const PaymentService = { getAllPayments, getPaymentByShipmentId, initiateStripePayment, confirmStripePayment, markPaymentAsPaid };
