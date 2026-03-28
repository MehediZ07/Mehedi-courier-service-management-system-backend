import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { ShipmentLegController } from './shipmentLeg.controller.js';
import { ShipmentLegValidation } from './shipmentLeg.validation.js';

const router = Router();

// Courier routes
router.get('/available', checkAuth('COURIER'), ShipmentLegController.getAvailableLegs);
router.get('/my-active', checkAuth('COURIER'), ShipmentLegController.getMyCourierLegs);
router.post('/:id/accept', checkAuth('COURIER'), ShipmentLegController.acceptLeg);
router.patch('/:id/pickup', checkAuth('COURIER'), ShipmentLegController.markLegPickedUp);
router.patch('/:id/deliver', checkAuth('COURIER'), validateRequest(ShipmentLegValidation.markDelivered), ShipmentLegController.markLegDelivered);
router.patch('/:id/refuse-pickup', checkAuth('COURIER'), ShipmentLegController.markPickupRefused);
router.patch('/:id/refuse-delivery', checkAuth('COURIER'), ShipmentLegController.markDeliveryRefused);

// Admin routes
router.get('/', checkAuth('ADMIN', 'SUPER_ADMIN'), ShipmentLegController.getAllLegs);
router.post('/:id/assign', checkAuth('ADMIN', 'SUPER_ADMIN'), ShipmentLegController.assignCourierToLeg);
router.post('/hub-transfer/release', checkAuth('ADMIN', 'SUPER_ADMIN'), ShipmentLegController.releaseHubTransfer);
router.post('/hub-transfer/confirm', checkAuth('ADMIN', 'SUPER_ADMIN'), ShipmentLegController.confirmHubTransfer);

// Get shipment legs (authenticated users)
router.get('/shipment/:shipmentId', checkAuth(), ShipmentLegController.getShipmentLegs);

export const ShipmentLegRoutes = router;
