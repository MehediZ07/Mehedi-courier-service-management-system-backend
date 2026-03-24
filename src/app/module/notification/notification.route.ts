import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { NotificationController } from './notification.controller.js';

const router = Router();

router.get('/', checkAuth(), NotificationController.getMyNotifications);
router.patch('/mark-all-read', checkAuth(), NotificationController.markAllAsRead);
router.patch('/:id/read', checkAuth(), NotificationController.markAsRead);

export const NotificationRoutes = router;
