import { z } from 'zod';

export const routerSchema = z.object({
  name: z.string().min(2, 'Jina la router linahitajika'),
  connectionType: z.enum(['agent', 'direct']),
  branchId: z.string().optional(),
  // Agent needs the router's LAN IP to reach RouterOS; required.
  host: z.string().min(3, 'IP ya router (LAN) inahitajika'),
  apiPort: z.number().int().min(1).max(65535),
  username: z.string().min(1, 'Jina la mtumiaji linahitajika'),
  password: z.string().optional(),
});

export type RouterFormInput = z.infer<typeof routerSchema>;
