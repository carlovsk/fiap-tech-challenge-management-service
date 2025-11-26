import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VehicleService } from './vehicle.service';
import { prisma } from '@/utils/prisma';
import { VehicleStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

vi.mock('@/utils/prisma', () => ({
  prisma: {
    vehicle: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('VehicleService', () => {
  let vehicleService: VehicleService;

  beforeEach(() => {
    vehicleService = new VehicleService();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a vehicle with valid data', async () => {
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

      vi.mocked(prisma.vehicle.create).mockResolvedValue(mockVehicle);

      const result = await vehicleService.create({
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        color: 'Blue',
        price: 50000,
        status: 'AVAILABLE',
      });

      expect(prisma.vehicle.create).toHaveBeenCalledWith({
        data: {
          brand: 'Toyota',
          model: 'Corolla',
          year: 2023,
          color: 'Blue',
          price: new Prisma.Decimal(50000),
          status: VehicleStatus.AVAILABLE,
        },
      });

      expect(result).toEqual(mockVehicle);
    });

    it('should create a vehicle with default status AVAILABLE', async () => {
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

      vi.mocked(prisma.vehicle.create).mockResolvedValue(mockVehicle);

      await vehicleService.create({
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        color: 'Blue',
        price: 50000,
      });

      expect(prisma.vehicle.create).toHaveBeenCalledWith({
        data: {
          brand: 'Toyota',
          model: 'Corolla',
          year: 2023,
          color: 'Blue',
          price: new Prisma.Decimal(50000),
          status: VehicleStatus.AVAILABLE,
        },
      });
    });
  });

  describe('findById', () => {
    it('should return a vehicle when found', async () => {
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

      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(mockVehicle);

      const result = await vehicleService.findById('123');

      expect(prisma.vehicle.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
      });

      expect(result).toEqual(mockVehicle);
    });

    it('should return null when vehicle not found', async () => {
      vi.mocked(prisma.vehicle.findUnique).mockResolvedValue(null);

      const result = await vehicleService.findById('123');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all vehicles when no filters provided', async () => {
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

      vi.mocked(prisma.vehicle.findMany).mockResolvedValue(mockVehicles);

      const result = await vehicleService.findAll();

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockVehicles);
    });

    it('should filter vehicles by status', async () => {
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

      vi.mocked(prisma.vehicle.findMany).mockResolvedValue(mockVehicles);

      await vehicleService.findAll({ status: VehicleStatus.AVAILABLE });

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
        where: { status: VehicleStatus.AVAILABLE },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter vehicles by brand', async () => {
      const mockVehicles: never[] = [];

      vi.mocked(prisma.vehicle.findMany).mockResolvedValue(mockVehicles);

      await vehicleService.findAll({ brand: 'Toyota' });

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
        where: { brand: { contains: 'Toyota', mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter vehicles by year', async () => {
      const mockVehicles: never[] = [];

      vi.mocked(prisma.vehicle.findMany).mockResolvedValue(mockVehicles);

      await vehicleService.findAll({ year: 2023 });

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
        where: { year: 2023 },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('update', () => {
    it('should update a vehicle with provided fields', async () => {
      const mockVehicle = {
        id: '123',
        brand: 'Toyota',
        model: 'Camry',
        year: 2024,
        color: 'Red',
        price: new Prisma.Decimal(60000),
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle);

      const result = await vehicleService.update('123', {
        model: 'Camry',
        year: 2024,
        color: 'Red',
        price: 60000,
      });

      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          model: 'Camry',
          year: 2024,
          color: 'Red',
          price: new Prisma.Decimal(60000),
        },
      });

      expect(result).toEqual(mockVehicle);
    });

    it('should update only provided fields', async () => {
      const mockVehicle = {
        id: '123',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        color: 'Red',
        price: new Prisma.Decimal(50000),
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.vehicle.update).mockResolvedValue(mockVehicle);

      await vehicleService.update('123', {
        color: 'Red',
      });

      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: {
          color: 'Red',
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete a vehicle', async () => {
      vi.mocked(prisma.vehicle.delete).mockResolvedValue({
        id: '123',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        color: 'Blue',
        price: new Prisma.Decimal(50000),
        status: VehicleStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await vehicleService.delete('123');

      expect(prisma.vehicle.delete).toHaveBeenCalledWith({
        where: { id: '123' },
      });
    });
  });
});
