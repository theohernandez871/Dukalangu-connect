import { z } from 'zod';

export const routerSchema = z
  .object({
    name: z.string().min(2, 'Jina la router linahitajika'),
    connectionType: z.enum(['agent', 'direct']),
    branchId: z.string().optional(),
    host: z.string().optional(),
    apiPort: z.number().int().min(1).max(65535),
    username: z.string().optional(),
    password: z.string().optional(),
  })
  .refine(
    (d) => d.connectionType !== 'direct' || (d.host && d.host.length > 0),
    { message: 'Host inahitajika kwa muunganisho wa moja kwa moja', path: ['host'] },
  );

export type RouterFormInput = z.infer<typeof routerSchema>;
