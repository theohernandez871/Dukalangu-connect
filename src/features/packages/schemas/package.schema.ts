import { z } from 'zod';
import { PACKAGE_TYPES, DURATION_UNITS } from '../types/package';

const optionalPositiveInt = z
  .number()
  .int()
  .positive()
  .optional()
  .or(z.nan().transform(() => undefined));

export const packageSchema = z
  .object({
    type: z.enum(PACKAGE_TYPES),
    name: z.string().min(2, 'Jina linahitajika'),
    description: z.string().optional(),
    price: z.number().min(0, 'Bei si sahihi'),
    branchId: z.string().optional(),
    durationValue: optionalPositiveInt,
    durationUnit: z.enum(DURATION_UNITS).optional(),
    dataLimitMb: optionalPositiveInt,
    speedDownKbps: optionalPositiveInt,
    speedUpKbps: optionalPositiveInt,
    routerProfile: z.string().optional(),
    validityDays: optionalPositiveInt,
    isActive: z.boolean().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.type === 'time' && !d.durationValue) {
      ctx.addIssue({ code: 'custom', message: 'Muda unahitajika', path: ['durationValue'] });
    }
    if (d.type === 'data' && !d.dataLimitMb) {
      ctx.addIssue({ code: 'custom', message: 'Kiasi cha data kinahitajika', path: ['dataLimitMb'] });
    }
    if (d.type === 'speed' && !d.speedDownKbps) {
      ctx.addIssue({ code: 'custom', message: 'Kasi ya download inahitajika', path: ['speedDownKbps'] });
    }
  });

export type PackageFormInput = z.infer<typeof packageSchema>;
