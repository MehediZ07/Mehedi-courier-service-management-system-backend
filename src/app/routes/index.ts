import { Router } from 'express';
import { AuthRoutes } from '../module/auth/auth.route.js';
import { UserRoutes } from '../module/user/user.route.js';
import { CourierRoutes } from '../module/courier/courier.route.js';
import { MerchantRoutes } from '../module/merchant/merchant.route.js';
import { ShipmentRoutes } from '../module/shipment/shipment.route.js';
import { PaymentRoutes } from '../module/payment/payment.route.js';
import { NotificationRoutes } from '../module/notification/notification.route.js';
import { PricingRoutes } from '../module/pricing/pricing.route.js';

const router = Router();

router.use('/auth', AuthRoutes);
router.use('/users', UserRoutes);
router.use('/couriers', CourierRoutes);
router.use('/merchants', MerchantRoutes);
router.use('/shipments', ShipmentRoutes);
router.use('/payments', PaymentRoutes);
router.use('/notifications', NotificationRoutes);
router.use('/pricing', PricingRoutes);

export const IndexRoutes = router;
