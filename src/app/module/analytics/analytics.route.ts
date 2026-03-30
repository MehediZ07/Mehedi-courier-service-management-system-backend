import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { AnalyticsController } from './analytics.controller.js';

const router = Router();

// Optional auth - will populate req.user if token exists, but won't fail if missing
const optionalAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      await checkAuth()(req, res, next);
    } else {
      next();
    }
  } catch (error) {
    next();
  }
};

router.post('/track', optionalAuth, AnalyticsController.trackVisit);
router.post('/track-guest', AnalyticsController.trackVisit);
router.get('/stats', checkAuth('SUPER_ADMIN'), AnalyticsController.getAnalytics);
router.get('/visits', checkAuth('SUPER_ADMIN'), AnalyticsController.getAllVisits);

export const AnalyticsRoutes = router;
