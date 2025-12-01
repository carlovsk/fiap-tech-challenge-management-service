import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const vehicleStatusSchema = z.enum(['AVAILABLE', 'SOLD']);

export const createVehicleSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  year: z
    .number()
    .int()
    .min(1900)
    .max(currentYear + 1, `Year must be between 1900 and ${currentYear + 1}`),
  color: z.string().min(1, 'Color is required'),
  price: z.number().positive('Price must be positive'),
  status: vehicleStatusSchema.default('AVAILABLE').optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const vehicleIdParamsSchema = z.object({
  id: z.string().uuid('Invalid vehicle ID format'),
});

export const vehicleQuerySchema = z.object({
  status: vehicleStatusSchema.optional(),
  brand: z.string().min(1).optional(),
  year: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (typeof val === 'number') return val;
      const parsed = parseInt(String(val), 10);
      return isNaN(parsed) ? undefined : parsed;
    },
    z
      .number()
      .int()
      .min(1900)
      .max(currentYear + 1)
      .optional(),
  ),
});

export const sellVehicleSchema = z.object({
  buyerCpf: z.string().min(11, 'CPF must have at least 11 characters').max(14, 'CPF must have at most 14 characters'),
  saleDate: z.coerce.date(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleIdParams = z.infer<typeof vehicleIdParamsSchema>;
export type VehicleQueryParams = z.infer<typeof vehicleQuerySchema>;
export type SellVehicleInput = z.infer<typeof sellVehicleSchema>;
