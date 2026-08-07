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

  // Phase 4 — MikroTik
  routers: '/routers',
  routerDetail: '/routers/:id',

  // Phase 5 — TP-Link Omada
  tplink: '/tplink',
  tplinkDetail: '/tplink/:id',

  // Phase 6 — Packages
  packages: '/packages',

  // Phase 7 — Vouchers
  vouchers: '/vouchers',
  quickSell: '/quick-sell',

  // Phase 8B — Customer Portal (public)
  portal: '/portal/:slug',
  // Phase 8B — Portal admin
  portalAdmin: '/portal-admin',

  // Fallback
  root: '/',
  notFound: '*',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
