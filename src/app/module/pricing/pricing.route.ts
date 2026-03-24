import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { PricingController } from './pricing.controller.js';
import { PricingValidation } from './pricing.validation.js';

const router = Router();

// Public — anyone can get pricing table or calculate a quote
router.get('/', PricingController.getAllPricing);
router.post('/calculate', validateRequest(PricingValidation.calculatePrice), PricingController.calculatePrice);

// Admin only — configure pricing
router.post('/', checkAuth('SUPER_ADMIN', 'ADMIN'), validateRequest(PricingValidation.upsertPricing), PricingController.upsertPricing);

export const PricingRoutes = router;
