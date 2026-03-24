import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { CourierController } from './courier.controller.js';
import { CourierValidation } from './courier.validation.js';

const router = Router();

router.post('/', checkAuth('SUPER_ADMIN', 'ADMIN'), validateRequest(CourierValidation.create), CourierController.createCourier);
router.get('/', checkAuth('SUPER_ADMIN', 'ADMIN'), CourierController.getAllCouriers);
router.get('/my-profile', checkAuth('COURIER'), CourierController.getMyCourierProfile);
router.patch('/toggle-availability', checkAuth('COURIER'), CourierController.toggleAvailability);
router.get('/:id', checkAuth('SUPER_ADMIN', 'ADMIN'), CourierController.getCourierById);
router.patch('/:id', checkAuth('SUPER_ADMIN', 'ADMIN'), validateRequest(CourierValidation.update), CourierController.updateCourier);
router.patch('/:id/approve', checkAuth('SUPER_ADMIN', 'ADMIN'), validateRequest(CourierValidation.approveReject), CourierController.approveCourier);
router.delete('/:id', checkAuth('SUPER_ADMIN'), CourierController.deleteCourier);

export const CourierRoutes = router;
