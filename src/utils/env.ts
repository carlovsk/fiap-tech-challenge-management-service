import dotenv from 'dotenv';
import z from 'zod';

dotenv.config();

export const env = z
  .object({
    NODE_ENV: z.string().default('development'),
    PORT: z.coerce.number(),
    SALES_SERVICE_URL: z.string().url('SALES_SERVICE_URL must be a valid URL'),
  })
  .parse(process.env);
