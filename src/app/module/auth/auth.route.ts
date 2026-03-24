import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { AuthController } from './auth.controller.js';
import { AuthValidation } from './auth.validation.js';

const router = Router();

router.post('/register', validateRequest(AuthValidation.register), AuthController.register);
router.post('/register-courier', validateRequest(AuthValidation.registerCourier), AuthController.registerCourier);
router.post('/login', validateRequest(AuthValidation.login), AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', checkAuth(), AuthController.logout);
router.post('/change-password', checkAuth(), validateRequest(AuthValidation.changePassword), AuthController.changePassword);
router.get('/me', checkAuth(), AuthController.getMe);

export const AuthRoutes = router;
