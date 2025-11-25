import { Router } from 'express';
import { VehicleController } from '../controllers/vehicle.controller';

const router = Router();

router.get('/api/vehicles', VehicleController.getAll);
router.post('/api/vehicles', VehicleController.create);
router.get('/api/vehicles/:id', VehicleController.getById);
router.put('/api/vehicles/:id', VehicleController.update);
router.delete('/api/vehicles/:id', VehicleController.delete);

export { router as vehicleRoutes };
