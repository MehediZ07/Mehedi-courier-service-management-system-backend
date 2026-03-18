import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth';
import { validateRequest } from '../../middleware/validateRequest';
import { CourierController } from './courier.controller';
import { CourierValidation } from './courier.validation';

const router = Router();

router.post('/', checkAuth('SUPER_ADMIN', 'ADMIN'), validateRequest(CourierValidation.create), CourierController.createCourier);
router.get('/', checkAuth('SUPER_ADMIN', 'ADMIN'), CourierController.getAllCouriers);
router.get('/my-profile', checkAuth('COURIER'), CourierController.getMyCourierProfile);
router.get('/:id', checkAuth('SUPER_ADMIN', 'ADMIN'), CourierController.getCourierById);
router.patch('/:id', checkAuth('SUPER_ADMIN', 'ADMIN'), validateRequest(CourierValidation.update), CourierController.updateCourier);
router.delete('/:id', checkAuth('SUPER_ADMIN'), CourierController.deleteCourier);

export const CourierRoutes = router;
