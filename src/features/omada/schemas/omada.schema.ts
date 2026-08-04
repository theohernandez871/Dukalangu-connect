import { z } from 'zod';

export const omadaSchema = z
  .object({
    name: z.string().min(2, 'Jina linahitajika'),
    connectionType: z.enum(['cloud', 'local']),
    branchId: z.string().optional(),
    baseUrl: z.string().optional(),
    omadacId: z.string().optional(),
    siteId: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  })
  .refine((d) => d.connectionType !== 'cloud' || (d.baseUrl && d.baseUrl.length > 0), {
    message: 'Base URL inahitajika kwa cloud/public',
    path: ['baseUrl'],
  });

export type OmadaFormInput = z.infer<typeof omadaSchema>;
