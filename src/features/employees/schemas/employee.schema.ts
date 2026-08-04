import { z } from 'zod';

/** Roles an admin may assign when inviting (owner/super_admin excluded). */
export const ASSIGNABLE_ROLES = [
  'branch_manager',
  'cashier',
  'technician',
  'sales_agent',
] as const;

export const inviteEmployeeSchema = z.object({
  email: z.string().email('Barua pepe si sahihi'),
  fullName: z.string().min(3, 'Jina kamili linahitajika'),
  role: z.enum(ASSIGNABLE_ROLES),
  branchId: z.string().min(1, 'Chagua tawi'),
});

export type InviteEmployeeFormInput = z.infer<typeof inviteEmployeeSchema>;
