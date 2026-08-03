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

  // Fallback
  root: '/',
  notFound: '*',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
