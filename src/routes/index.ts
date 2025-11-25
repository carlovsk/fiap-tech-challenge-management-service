import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { vehicleRoutes } from './vehicles';

const router = Router();

// Mount route modules
router.use(healthRoutes);
router.use(vehicleRoutes);

export { router as routes };
