import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth';
import { validateRequest } from '../../middleware/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = Router();

router.get('/', checkAuth('SUPER_ADMIN', 'ADMIN'), UserController.getAllUsers);
router.get('/:id', checkAuth('SUPER_ADMIN', 'ADMIN'), UserController.getUserById);
router.patch('/:id', checkAuth('SUPER_ADMIN', 'ADMIN'), validateRequest(UserValidation.updateUser), UserController.updateUser);
router.patch('/:id/status', checkAuth('SUPER_ADMIN', 'ADMIN'), validateRequest(UserValidation.updateStatus), UserController.updateStatus);
router.patch('/:id/role', checkAuth('SUPER_ADMIN'), validateRequest(UserValidation.updateRole), UserController.updateRole);
router.delete('/:id', checkAuth('SUPER_ADMIN'), UserController.deleteUser);

export const UserRoutes = router;
