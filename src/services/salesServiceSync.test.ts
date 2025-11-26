import { Prisma, VehicleStatus } from '@prisma/client';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SalesServiceSync } from './salesServiceSync';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    isAxiosError: vi.fn(),
  },
  isAxiosError: vi.fn(),
}));
vi.mock('@/utils/env', () => ({
  env: {
    SALES_SERVICE_URL: 'http://localhost:3001',
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe('SalesServiceSync', () => {
  const mockAxiosPost = vi.mocked(axios.post);
  const mockIsAxiosError = vi.mocked(axios.isAxiosError);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('syncVehicle', () => {
    it('should sync vehicle data successfully', async () => {
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

      mockAxiosPost.mockResolvedValue({ status: 200, data: {} });

      await SalesServiceSync.syncVehicle(mockVehicle);

      expect(mockAxiosPost).toHaveBeenCalledWith(
        'http://localhost:3001/api/internal/vehicles/sync',
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          brand: 'Toyota',
          model: 'Corolla',
          year: 2023,
          color: 'Blue',
          price: 50000,
          status: 'AVAILABLE',
        },
        { timeout: 5000 },
      );
    });

    it('should handle axios errors gracefully without throwing', async () => {
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

      const axiosError = {
        isAxiosError: true,
        response: {
          status: 500,
          statusText: 'Internal Server Error',
        },
        message: 'Network Error',
      };

      mockAxiosPost.mockRejectedValue(axiosError);
      mockIsAxiosError.mockReturnValue(true);

      // Should not throw
      await expect(SalesServiceSync.syncVehicle(mockVehicle)).resolves.not.toThrow();

      expect(mockAxiosPost).toHaveBeenCalled();
    });

    it('should handle non-axios errors gracefully without throwing', async () => {
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

      const genericError = new Error('Generic error');
      mockAxiosPost.mockRejectedValue(genericError);
      mockIsAxiosError.mockReturnValue(false);

      // Should not throw
      await expect(SalesServiceSync.syncVehicle(mockVehicle)).resolves.not.toThrow();

      expect(mockAxiosPost).toHaveBeenCalled();
    });

    it('should handle timeout errors gracefully', async () => {
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

      const timeoutError = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
      };

      mockAxiosPost.mockRejectedValue(timeoutError);
      mockIsAxiosError.mockReturnValue(true);

      // Should not throw
      await expect(SalesServiceSync.syncVehicle(mockVehicle)).resolves.not.toThrow();

      expect(mockAxiosPost).toHaveBeenCalled();
    });

    it('should convert Decimal price to number in sync data', async () => {
      const mockVehicle = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2023,
        color: 'Blue',
        price: new Prisma.Decimal(75000.99),
        status: VehicleStatus.SOLD,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAxiosPost.mockResolvedValue({ status: 200, data: {} });

      await SalesServiceSync.syncVehicle(mockVehicle);

      expect(mockAxiosPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          price: 75000.99,
        }),
        expect.any(Object),
      );
    });
  });
});
