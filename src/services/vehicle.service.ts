import { CreateVehicleInput, UpdateVehicleInput, VehicleQueryParams } from '@/schemas/vehicle.schema';
import { logger } from '@/utils/logger';
import { prisma } from '@/utils/prisma';
import { Prisma, Vehicle, VehicleStatus } from '@prisma/client';

export class VehicleService {
  private static logger = logger('services:vehicle');

  async create(data: CreateVehicleInput): Promise<Vehicle> {
    return prisma.vehicle.create({
      data: {
        brand: data.brand,
        model: data.model,
        year: data.year,
        color: data.color,
        price: new Prisma.Decimal(data.price),
        status: data.status || VehicleStatus.AVAILABLE,
      },
    });
  }

  async findById(id: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({
      where: { id },
    });
  }

  async findAll(filters?: VehicleQueryParams): Promise<Vehicle[]> {
    VehicleService.logger.info('Fetching vehicles', filters);
    const where: Prisma.VehicleWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.brand) {
      where.brand = { contains: filters.brand, mode: 'insensitive' };
    }

    if (filters?.year) {
      where.year = filters.year;
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    VehicleService.logger.info('Vehicles fetched', vehicles);

    return vehicles;
  }

  async update(id: string, data: UpdateVehicleInput): Promise<Vehicle> {
    const updateData: Prisma.VehicleUpdateInput = {};

    if (data.brand !== undefined) {
      updateData.brand = data.brand;
    }

    if (data.model !== undefined) {
      updateData.model = data.model;
    }

    if (data.year !== undefined) {
      updateData.year = data.year;
    }

    if (data.color !== undefined) {
      updateData.color = data.color;
    }

    if (data.price !== undefined) {
      updateData.price = new Prisma.Decimal(data.price);
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    return prisma.vehicle.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.vehicle.delete({
      where: { id },
    });
  }

  async sell(id: string): Promise<Vehicle> {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new Error('Record to update does not exist');
    }

    if (vehicle.status === VehicleStatus.SOLD) {
      VehicleService.logger.warn(`Vehicle ${id} is already marked as SOLD`);
    }

    return prisma.vehicle.update({
      where: { id },
      data: {
        status: VehicleStatus.SOLD,
      },
    });
  }
}
