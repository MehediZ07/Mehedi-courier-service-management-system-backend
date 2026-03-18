import { Router } from 'express';
import { AuthRoutes } from '../module/auth/auth.route';
import { UserRoutes } from '../module/user/user.route';
import { CourierRoutes } from '../module/courier/courier.route';
import { MerchantRoutes } from '../module/merchant/merchant.route';
import { ShipmentRoutes } from '../module/shipment/shipment.route';
import { PaymentRoutes } from '../module/payment/payment.route';
import { NotificationRoutes } from '../module/notification/notification.route';

const router = Router();

router.use('/auth', AuthRoutes);
router.use('/users', UserRoutes);
router.use('/couriers', CourierRoutes);
router.use('/merchants', MerchantRoutes);
router.use('/shipments', ShipmentRoutes);
router.use('/payments', PaymentRoutes);
router.use('/notifications', NotificationRoutes);

export const IndexRoutes = router;
