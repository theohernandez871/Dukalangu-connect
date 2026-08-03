import { motion } from 'framer-motion';
import { ArrowRightOnRectangleIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ROLE_DEFINITIONS } from '@/constants/rbac';

/**
 * Placeholder shown after login until Phase 2 (Dashboard) is built.
 * Confirms auth + RBAC are wired correctly.
 */
export function DashboardPlaceholder() {
  const { session, logout } = useAuth();
  if (!session) return null;

  const role = ROLE_DEFINITIONS[session.profile.role];

  return (
    <div className="min-h-screen p-6">
      <header className="mx-auto flex max-w-4xl items-center justify-between">
        <span className="text-lg font-bold text-gradient">Hotspot Billing</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="secondary" size="sm" onClick={() => logout()}>
            <ArrowRightOnRectangleIcon className="h-4 w-4" /> Toka
          </Button>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-16 max-w-md glass-card p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-500/15 text-success-600">
          <CheckBadgeIcon className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold">Karibu, {session.profile.fullName}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{session.profile.email}</p>
        <div className="mt-4 inline-flex rounded-full bg-primary-600/10 px-3 py-1 text-sm font-semibold text-primary-600">
          {role.label}
        </div>
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Phase 1 (Authentication) imekamilika. Dashboard kamili itajengwa Phase 2.
        </p>
        <p className="mt-2 text-xs text-slate-400">Ruhusa: {session.permissions.length}</p>
      </motion.div>
    </div>
  );
}
