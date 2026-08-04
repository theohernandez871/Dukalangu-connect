export const ROUTES = {
  // Public / auth
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  twoFactor: '/two-factor',

  // Authenticated (placeholder — expanded in Phase 2)
  dashboard: '/dashboard',

  // Phase 3 — Company Management
  companies: '/companies',
  employees: '/employees',
  permissions: '/permissions',
  activity: '/activity',

  // Fallback
  root: '/',
  notFound: '*',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
