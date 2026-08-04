import { z } from 'zod';

export const companySchema = z.object({
  name: z.string().min(2, 'Jina la kampuni linahitajika'),
});

export const branchSchema = z.object({
  name: z.string().min(2, 'Jina la tawi linahitajika'),
  location: z.string().optional(),
  phone: z.string().optional(),
  managerId: z.string().optional(),
});

export type CompanyInput = z.infer<typeof companySchema>;
export type BranchFormInput = z.infer<typeof branchSchema>;
