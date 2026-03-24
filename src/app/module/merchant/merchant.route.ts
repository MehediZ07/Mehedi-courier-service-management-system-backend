import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { MerchantController } from './merchant.controller.js';
import { MerchantValidation } from './merchant.validation.js';

const router = Router();

router.post('/', checkAuth('SUPER_ADMIN', 'ADMIN'), validateRequest(MerchantValidation.create), MerchantController.createMerchant);
router.get('/', checkAuth('SUPER_ADMIN', 'ADMIN'), MerchantController.getAllMerchants);
router.get('/my-profile', checkAuth('MERCHANT'), MerchantController.getMyMerchantProfile);
router.get('/:id', checkAuth('SUPER_ADMIN', 'ADMIN'), MerchantController.getMerchantById);
router.patch('/:id', checkAuth('SUPER_ADMIN', 'ADMIN'), validateRequest(MerchantValidation.update), MerchantController.updateMerchant);
router.delete('/:id', checkAuth('SUPER_ADMIN'), MerchantController.deleteMerchant);

export const MerchantRoutes = router;
