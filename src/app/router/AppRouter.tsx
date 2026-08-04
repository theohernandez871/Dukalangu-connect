import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import { PublicOnlyRoute } from '@/app/router/PublicOnlyRoute';
import { NotFoundPage } from '@/app/router/NotFoundPage';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { ROUTES } from '@/constants/routes';

// Lazy-loaded pages → code splitting per route.
const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../../features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('../../features/auth/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('../../features/auth/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import('../../features/auth/pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));
const TwoFactorPage = lazy(() => import('../../features/auth/pages/TwoFactorPage').then((m) => ({ default: m.TwoFactorPage })));
const DashboardLayout = lazy(() => import('../../components/layout/DashboardLayout').then((m) => ({ default: m.DashboardLayout })));
const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CompanyPage = lazy(() => import('../../features/companies/pages/CompanyPage').then((m) => ({ default: m.CompanyPage })));
const EmployeesPage = lazy(() => import('../../features/employees/pages/EmployeesPage').then((m) => ({ default: m.EmployeesPage })));
const PermissionsPage = lazy(() => import('../../features/employees/pages/PermissionsPage').then((m) => ({ default: m.PermissionsPage })));
const ActivityPage = lazy(() => import('../../features/activity/pages/ActivityPage').then((m) => ({ default: m.ActivityPage })));
const RoutersPage = lazy(() => import('../../features/routers/pages/RoutersPage').then((m) => ({ default: m.RoutersPage })));
const RouterDetailPage = lazy(() => import('../../features/routers/pages/RouterDetailPage').then((m) => ({ default: m.RouterDetailPage })));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route path={ROUTES.root} element={<Navigate to={ROUTES.login} replace />} />

          {/* Public-only (auth) routes */}
          <Route element={<PublicOnlyRoute />}>
            <Route path={ROUTES.login} element={<LoginPage />} />
            <Route path={ROUTES.register} element={<RegisterPage />} />
            <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          </Route>

          {/* Accessible regardless of auth state (token callbacks) */}
          <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
          <Route path={ROUTES.verifyEmail} element={<VerifyEmailPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path={ROUTES.twoFactor} element={<TwoFactorPage />} />
            <Route element={<DashboardLayout />}>
              <Route path={ROUTES.dashboard} element={<DashboardPage />} />
              <Route path={ROUTES.companies} element={<CompanyPage />} />
              <Route path={ROUTES.employees} element={<EmployeesPage />} />
              <Route path={ROUTES.permissions} element={<PermissionsPage />} />
              <Route path={ROUTES.activity} element={<ActivityPage />} />
              <Route path={ROUTES.routers} element={<RoutersPage />} />
              <Route path={ROUTES.routerDetail} element={<RouterDetailPage />} />
            </Route>
          </Route>

          <Route path={ROUTES.notFound} element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
