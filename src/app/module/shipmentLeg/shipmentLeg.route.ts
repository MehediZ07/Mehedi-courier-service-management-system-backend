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

// Get shipment legs (authenticated users)
router.get('/shipment/:shipmentId', checkAuth(), ShipmentLegController.getShipmentLegs);

export const ShipmentLegRoutes = router;
