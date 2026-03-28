import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { PaymentController } from './payment.controller.js';

const router = Router();

router.get('/', checkAuth('SUPER_ADMIN', 'ADMIN'), PaymentController.getAllPayments);
router.get('/:shipmentId', checkAuth(), PaymentController.getPaymentByShipmentId);
router.post('/:shipmentId/initiate-stripe', checkAuth('USER', 'MERCHANT'), PaymentController.initiateStripePayment);
router.post('/confirm-stripe', PaymentController.confirmStripePayment);
router.patch('/:shipmentId/mark-paid', checkAuth('SUPER_ADMIN', 'ADMIN'), PaymentController.markPaymentAsPaid);

export const PaymentRoutes = router;
