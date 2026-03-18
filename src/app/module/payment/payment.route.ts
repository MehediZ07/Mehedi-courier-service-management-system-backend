import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth';
import { PaymentController } from './payment.controller';

const router = Router();

router.get('/', checkAuth('SUPER_ADMIN', 'ADMIN'), PaymentController.getAllPayments);
router.get('/:shipmentId', checkAuth(), PaymentController.getPaymentByShipmentId);
router.patch('/:shipmentId/mark-paid', checkAuth('SUPER_ADMIN', 'ADMIN'), PaymentController.markPaymentAsPaid);

export const PaymentRoutes = router;
