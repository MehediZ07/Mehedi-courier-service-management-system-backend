import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { ShipmentController } from './shipment.controller.js';
import { ShipmentValidation } from './shipment.validation.js';

const router = Router();

// Public tracking
router.get('/track/:trackingNumber', ShipmentController.trackShipment);

// Authenticated
router.post('/', checkAuth('USER', 'MERCHANT'), validateRequest(ShipmentValidation.create), ShipmentController.createShipment);
router.get('/my', checkAuth('USER', 'MERCHANT'), ShipmentController.getMyShipments);
router.get('/courier/assigned', checkAuth('COURIER'), ShipmentController.getMyCourierShipments);
router.get('/courier/available', checkAuth('COURIER'), ShipmentController.getAvailableShipments);
router.post('/:id/accept', checkAuth('COURIER'), ShipmentController.acceptShipment);
router.get('/', checkAuth('SUPER_ADMIN', 'ADMIN'), ShipmentController.getAllShipments);
router.get('/:id', checkAuth(), ShipmentController.getShipmentById);
router.patch('/:id/assign', checkAuth('SUPER_ADMIN', 'ADMIN'), validateRequest(ShipmentValidation.assignCourier), ShipmentController.assignCourier);
router.patch('/:id/status', checkAuth('COURIER'), validateRequest(ShipmentValidation.updateStatus), ShipmentController.updateShipmentStatus);

export const ShipmentRoutes = router;
