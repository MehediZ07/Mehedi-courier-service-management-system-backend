import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { HubController } from './hub.controller.js';
import { HubValidation } from './hub.validation.js';

const router = Router();

// Public route for getting available cities
router.get('/cities', HubController.getHubCities);

// Admin only routes
router.post('/', checkAuth('SUPER_ADMIN', 'ADMIN'), validateRequest(HubValidation.create), HubController.createHub);
router.get('/', checkAuth('SUPER_ADMIN', 'ADMIN'), HubController.getAllHubs);
router.get('/city/:city', checkAuth('SUPER_ADMIN', 'ADMIN'), HubController.getHubsByCity);
router.get('/:id', checkAuth('SUPER_ADMIN', 'ADMIN'), HubController.getHubById);
router.patch('/:id', checkAuth('SUPER_ADMIN', 'ADMIN'), validateRequest(HubValidation.update), HubController.updateHub);
router.delete('/:id', checkAuth('SUPER_ADMIN'), HubController.deleteHub);
router.get('/:id/shipments', checkAuth('SUPER_ADMIN', 'ADMIN'), HubController.getHubShipments);

export const HubRoutes = router;
