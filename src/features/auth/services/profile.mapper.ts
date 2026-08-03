import type { Profile } from '@/types/auth';
import type { UserRole } from '@/types/rbac';

/** Raw shape of a `profiles` row from Postgres (snake_case). */
export interface ProfileRow {
  id: string;
  company_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  email_verified: boolean;
  two_factor_enabled: boolean;
  created_at: string;
}

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    companyId: row.company_id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    avatarUrl: row.avatar_url,
    isActive: row.is_active,
    emailVerified: row.email_verified,
    twoFactorEnabled: row.two_factor_enabled,
    createdAt: row.created_at,
  };
}
