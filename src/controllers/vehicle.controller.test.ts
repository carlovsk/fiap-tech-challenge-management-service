import { Prisma, VehicleStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Use vi.hoisted to ensure mocks are created before module loading
const { mockVehicleServiceMethods } = vi.hoisted(() => {
  const mocks = {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return { mockVehicleServiceMethods: mocks };
});

vi.mock('../services/vehicle.service', () => ({
  VehicleService: vi.fn().mockImplementation(() => mockVehicleServiceMethods),
}));

import { VehicleController } from './vehicle.controller';

vi.mock('../utils/logger', () => ({
  logger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe('VehicleController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockJson = vi.fn().mockReturnThis();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      params: {},
      body: {},
      query: {},
    };

    mockResponse = {
      json: mockJson,
      status: mockStatus,
    } as Partial<Response>;

    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a vehicle successfully', async () => {
      const mockVehicle = {
        id: '123',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        color: 'Blue',
        price: new Prisma.Decimal(50000),
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = {
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        color: 'Blue',
        price: 50000,
      };

      mockVehicleServiceMethods.create.mockResolvedValue(mockVehicle);

      await VehicleController.create(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(mockVehicle);
    });

    it('should return 400 on validation error - missing required field', async () => {
      mockRequest.body = {
        model: 'Corolla',
        year: 2023,
        color: 'Blue',
        price: 50000,
        // brand is missing
      };

      await VehicleController.create(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Object),
        }),
      );
    });

    it('should return 400 on validation error - invalid year', async () => {
      mockRequest.body = {
        brand: 'Toyota',
        model: 'Corolla',
        year: 1800, // Invalid year (too old)
        color: 'Blue',
        price: 50000,
      };

      await VehicleController.create(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Object),
        }),
      );
    });

    it('should return 400 on validation error - negative price', async () => {
      mockRequest.body = {
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        color: 'Blue',
        price: -1000, // Invalid price (negative)
      };

      await VehicleController.create(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Object),
        }),
      );
    });

    it('should return 500 on service error', async () => {
      mockRequest.body = {
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        color: 'Blue',
        price: 50000,
      };

      mockVehicleServiceMethods.create.mockRejectedValue(new Error('Database error'));

      await VehicleController.create(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getById', () => {
    it('should return a vehicle when found', async () => {
      const mockVehicle = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        color: 'Blue',
        price: new Prisma.Decimal(50000),
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockVehicleServiceMethods.findById.mockResolvedValue(mockVehicle);

      await VehicleController.getById(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockVehicleServiceMethods.findById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockVehicle);
    });

    it('should return 404 when vehicle not found', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockVehicleServiceMethods.findById.mockResolvedValue(null);

      await VehicleController.getById(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Vehicle not found' });
    });

    it('should return 400 on invalid ID format', async () => {
      mockRequest.params = { id: 'invalid-id' };

      await VehicleController.getById(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Object),
        }),
      );
    });

    it('should return 500 on service error', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockVehicleServiceMethods.findById.mockRejectedValue(new Error('Database error'));

      await VehicleController.getById(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('getAll', () => {
    it('should return all vehicles', async () => {
      const mockVehicles = [
        {
          id: '123',
          brand: 'Toyota',
          model: 'Corolla',
          year: 2023,
          color: 'Blue',
          price: new Prisma.Decimal(50000),
          status: VehicleStatus.AVAILABLE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRequest.query = {};
      mockVehicleServiceMethods.findAll.mockResolvedValue(mockVehicles);

      await VehicleController.getAll(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockVehicleServiceMethods.findAll).toHaveBeenCalledWith({});
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockVehicles);
    });

    it('should filter vehicles by query parameters', async () => {
      const mockVehicles: never[] = [];

      mockRequest.query = { status: 'AVAILABLE', brand: 'Toyota', year: '2023' };
      mockVehicleServiceMethods.findAll.mockResolvedValue(mockVehicles);

      await VehicleController.getAll(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockVehicleServiceMethods.findAll).toHaveBeenCalledWith({
        status: 'AVAILABLE',
        brand: 'Toyota',
        year: 2023,
      });
    });

    it('should return 400 on invalid query parameters - invalid status', async () => {
      mockRequest.query = { status: 'INVALID_STATUS' };

      await VehicleController.getAll(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Object),
        }),
      );
    });

    it('should return 400 on invalid query parameters - year out of range', async () => {
      mockRequest.query = { year: '1800' }; // Too old, should fail validation

      await VehicleController.getAll(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Object),
        }),
      );
    });

    it('should return 400 on invalid query parameters - year out of range', async () => {
      mockRequest.query = { year: '1800' }; // Too old

      await VehicleController.getAll(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Object),
        }),
      );
    });

    it('should return 500 on service error', async () => {
      mockRequest.query = {};
      mockVehicleServiceMethods.findAll.mockRejectedValue(new Error('Database error'));

      await VehicleController.getAll(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('update', () => {
    it('should update a vehicle successfully', async () => {
      const mockVehicle = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        brand: 'Toyota',
        model: 'Camry',
        year: 2024,
        color: 'Red',
        price: new Prisma.Decimal(60000),
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockRequest.body = { model: 'Camry', year: 2024 };

      mockVehicleServiceMethods.update.mockResolvedValue(mockVehicle);

      await VehicleController.update(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockVehicle);
    });

    it('should return 400 on validation error for body - invalid year', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockRequest.body = { year: 'not-a-number' };

      await VehicleController.update(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Object),
        }),
      );
    });

    it('should return 400 on validation error for body - negative price', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockRequest.body = { price: -1000 };

      await VehicleController.update(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Object),
        }),
      );
    });

    it('should return 400 on validation error for params - invalid ID', async () => {
      mockRequest.params = { id: 'invalid-id' };
      mockRequest.body = { model: 'Camry' };

      await VehicleController.update(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Object),
        }),
      );
    });

    it('should return 404 when vehicle not found', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockRequest.body = { model: 'Camry' };

      const error = new Error('Record to update does not exist');
      mockVehicleServiceMethods.update.mockRejectedValue(error);

      await VehicleController.update(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Vehicle not found' });
    });

    it('should return 500 on service error', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockRequest.body = { model: 'Camry' };

      mockVehicleServiceMethods.update.mockRejectedValue(new Error('Database error'));

      await VehicleController.update(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('delete', () => {
    it('should delete a vehicle successfully', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockVehicleServiceMethods.delete.mockResolvedValue(undefined);

      await VehicleController.delete(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockVehicleServiceMethods.delete).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Vehicle deleted successfully' });
    });

    it('should return 400 on invalid ID format', async () => {
      mockRequest.params = { id: 'invalid-id' };

      await VehicleController.delete(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.any(Object),
        }),
      );
    });

    it('should return 404 when vehicle not found', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      const error = new Error('Record to delete does not exist');
      mockVehicleServiceMethods.delete.mockRejectedValue(error);

      await VehicleController.delete(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Vehicle not found' });
    });

    it('should return 500 on service error', async () => {
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' };
      mockVehicleServiceMethods.delete.mockRejectedValue(new Error('Database error'));

      await VehicleController.delete(mockRequest as Request, mockResponse as Response, () => {});

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
