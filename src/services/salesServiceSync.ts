import { env } from '@/utils/env';
import { logger } from '@/utils/logger';
import { Vehicle } from '@prisma/client';
import axios, { AxiosError } from 'axios';

const syncLogger = logger('services:salesServiceSync');

interface VehicleSyncData {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  price: number;
  status: string;
}

export class SalesServiceSync {
  private static salesServiceUrl = env.SALES_SERVICE_URL;

  static async syncVehicle(vehicle: Vehicle): Promise<void> {
    try {
      const syncData: VehicleSyncData = {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        price: Number(vehicle.price),
        status: vehicle.status,
      };

      await axios.post(`${SalesServiceSync.salesServiceUrl}/api/internal/vehicles/sync`, syncData, {
        timeout: 5000,
      });

      syncLogger.info(`Vehicle synced successfully: ${vehicle.id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        syncLogger.error(`Failed to sync vehicle ${vehicle.id} to sales service`, {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          message: axiosError.message,
        });
      } else {
        syncLogger.error(`Failed to sync vehicle ${vehicle.id} to sales service`, error);
      }
      // Don't throw - we want to continue even if sync fails
    }
  }
}
