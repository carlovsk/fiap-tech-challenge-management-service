import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamsSchema,
  vehicleQuerySchema,
} from '@/schemas/vehicle.schema';
import { VehicleService } from '@/services/vehicle.service';
import { logger } from '@/utils/logger';
import { Request, RequestHandler, Response } from 'express';
import { pick } from 'lodash';

export class VehicleController {
  private static logger = logger('controllers:vehicle');
  private static vehicleService = new VehicleService();

  private static handleError(error: unknown, res: Response): void {
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }

  static create: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = createVehicleSchema.parse(req.body);
      const vehicle = await VehicleController.vehicleService.create(validatedData);
      VehicleController.logger.info(`Vehicle created with id: ${vehicle.id}`);
      res.status(201).json(vehicle);
    } catch (error) {
      VehicleController.logger.error('Error creating vehicle', error);
      VehicleController.handleError(error, res);
    }
  };

  static getById: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = vehicleIdParamsSchema.parse({ id: req.params.id });
      const vehicle = await VehicleController.vehicleService.findById(id);

      if (!vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      res.status(200).json(vehicle);
    } catch (error) {
      VehicleController.logger.error('Error fetching vehicle', error);
      VehicleController.handleError(error, res);
    }
  };

  static getAll: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      VehicleController.logger.info('Fetching vehicles', pick(req, 'query', 'params', 'body', 'headers'));
      const filters = vehicleQuerySchema.parse(req.query);
      const vehicles = await VehicleController.vehicleService.findAll(filters);
      res.status(200).json(vehicles);
    } catch (error) {
      VehicleController.logger.error('Error fetching vehicles', error);
      VehicleController.handleError(error, res);
    }
  };

  static update: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = vehicleIdParamsSchema.parse({ id: req.params.id });
      const validatedData = updateVehicleSchema.parse(req.body);

      const vehicle = await VehicleController.vehicleService.update(id, validatedData);
      VehicleController.logger.info(`Vehicle updated with id: ${id}`);
      res.status(200).json(vehicle);
    } catch (error) {
      VehicleController.logger.error('Error updating vehicle', error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation error', details: error });
        return;
      }
      if (error instanceof Error && error.message.includes('Record to update does not exist')) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  static delete: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = vehicleIdParamsSchema.parse({ id: req.params.id });
      await VehicleController.vehicleService.delete(id);
      VehicleController.logger.info(`Vehicle deleted with id: ${id}`);
      res.status(200).json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
      VehicleController.logger.error('Error deleting vehicle', error);
      if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation error', details: error });
        return;
      }
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
