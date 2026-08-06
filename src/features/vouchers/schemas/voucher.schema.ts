import { z } from 'zod';

export const generateSchema = z.object({
  packageId: z.string().min(1, 'Chagua kifurushi'),
  count: z.number().int().min(1, 'Angalau 1').max(1000, 'Kiwango cha juu ni 1000'),
  length: z.number().int().min(4).max(12),
  prefix: z.string().max(10).optional(),
  notes: z.string().max(200).optional(),
  branchId: z.string().optional(),
  validDays: z.number().int().positive().optional().or(z.nan().transform(() => undefined)),
  routerId: z.string().optional(),
  routerProfile: z.string().max(64).optional(),
});

export type GenerateFormInput = z.infer<typeof generateSchema>;
