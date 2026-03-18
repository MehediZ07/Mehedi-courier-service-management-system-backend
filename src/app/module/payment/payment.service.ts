import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { IQueryParams } from '../../interfaces/query.interface';

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

export const PaymentService = { getAllPayments, getPaymentByShipmentId, markPaymentAsPaid };
