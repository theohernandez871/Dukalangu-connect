# PHASE 1 — Authentication & RBAC (IMEKAMILIKA 100%)

Hati hii inaeleza kila kilichojengwa kwenye Phase 1. Fuata mtiririko wa pointi 8 kama ilivyoagizwa.

---

## 1. Architecture

**Clean Architecture + Feature-Based.** Kila feature (kwa sasa `auth`) ina layers zake:

```
Presentation  →  pages/ + components/      (React, UI tu)
Application   →  hooks/                     (TanStack Query mutations, useAuth)
Domain        →  services/*.service.ts      (logic + tafsiri ya makosa)
Data Access   →  services/*.repository.ts   (Supabase raw calls)
Mapping       →  services/*.mapper.ts       (DB row → domain type)
Validation    →  schemas/ (Zod)
Types         →  types/
```

**Kanuni:** UI haigusi Supabase moja kwa moja. Inapita `hook → service → repository`. Hii inaruhusu kubadilisha backend bila kuvunja UI.

**Multi-tenancy:** Shared database, isolation kwa `company_id` + RLS. Kila mtumiaji ana `company_id`; RLS policies zinahakikisha hawezi kuona data ya kampuni nyingine.

---

## 2. Folders mpya

```
src/
  app/
    providers/    AuthProvider, QueryProvider
    router/       AppRouter, ProtectedRoute, PublicOnlyRoute, NotFoundPage
  components/
    ui/           Button, Input, PasswordInput, Spinner, ThemeToggle
    feedback/     Alert, FullPageLoader
  contexts/       auth-context (createContext)
  constants/      rbac (role→permission map), routes
  features/auth/
    components/    AuthShell, LoginForm, RegisterForm, ForgotPasswordForm,
                   ResetPasswordForm, TwoFactorForm, TwoFactorEnroll
    hooks/         useAuth, useAuthMutations
    pages/         Login, Register, ForgotPassword, ResetPassword,
                   VerifyEmail, TwoFactor, DashboardPlaceholder
    schemas/       auth.schema (Zod)
    services/      auth.repository, auth.service, mfa.service, profile.mapper
  hooks/          useTheme
  lib/            supabase (client singleton)
  types/          auth, rbac
  utils/          cn, format
  styles/         index.css
supabase/migrations/  0001_auth_rbac.sql, 0002_rls_policies.sql
```

---

## 3. Files mpya (muhimu)

| File | Kazi |
|------|------|
| `lib/supabase.ts` | Supabase client (PKCE flow, session persist) |
| `constants/rbac.ts` | Role definitions + `resolvePermissions()` |
| `services/auth.repository.ts` | Supabase raw auth/profile calls |
| `services/auth.service.ts` | Domain logic + tafsiri makosa (Kiswahili) |
| `services/mfa.service.ts` | 2FA TOTP (enroll, challenge, verify) |
| `app/providers/AuthProvider.tsx` | Session lifecycle + `onAuthStateChange` |
| `app/router/AppRouter.tsx` | Lazy-loaded routes + code splitting |
| `app/router/ProtectedRoute.tsx` | Guard: auth required |
| `app/router/PublicOnlyRoute.tsx` | Guard: redirect authed users |

Reusable UI (Button, Input, PasswordInput, Alert, Spinner) zitatumika phase zote.

---

## 4. Database changes

**Enums:** `user_role` (roles 8).

**Tables:**
- `companies` — tenants (id, name, slug, owner_id, is_active)
- `profiles` — 1:1 na `auth.users` (company_id, role, email_verified, two_factor_enabled)
- `audit_logs` — matukio ya usalama (signup, n.k.)

**Functions (SECURITY DEFINER):**
- `current_company_id()` — hutumika ndani ya RLS bila recursion
- `handle_new_user()` — trigger: huunda company + owner profile kutoka `raw_user_meta_data`
- `handle_user_confirmed()` — huweka `email_verified = true` baada ya uthibitisho

**RLS:** Imewashwa kwa tables zote 3. Policies zinahakikisha isolation ya kampuni; audit logs zinasomwa na admin/owner tu.

---

## 5. API mpya (service layer)

**authService:** `login`, `register`, `logout`, `getCurrentSession`, `forgotPassword`, `resetPassword`, `resendVerification`.

**mfaService:** `enroll`, `challengeAndVerify`, `getAssuranceLevel`, `listFactors`.

Zote zinarudisha `AuthSession` (profile + permissions) au zinatupa `AuthError` yenye ujumbe wa Kiswahili.

---

## 6. Sababu za maamuzi ya architecture

- **Repository + Service split** — kubadilisha Supabase baadaye (au ku-mock kwa test) bila kugusa UI.
- **Shared DB + RLS** (si DB-per-tenant) — nafuu, scalable hadi maelfu ya tenants; ndio pattern ya SaaS kubwa.
- **Signup trigger (`SECURITY DEFINER`)** — mteja anaingia mara moja; company + profile vinaundwa atomically upande wa DB, si client (salama zaidi).
- **`current_company_id()` STABLE function** — kuzuia recursive RLS na kuboresha performance ya policy checks.
- **Lazy loading kila page** — bundle ndogo ya awali; kila route ni chunk yake.
- **Zod + React Hook Form** — validation moja (schema) inatumika client-side, na aina zake (types) zinatoka kwa schema (`z.infer`).
- **Supabase MFA (TOTP)** — hakuna kuhifadhi secrets sisi wenyewe; Supabase inashughulikia usalama wa 2FA.

---

## 7. Duplicated code — HAKUNA

- Permissions zinaundwa kwa composition (`OWNER_PERMS`, `MANAGER_PERMS`) — hazirudiwi.
- Forms zote zinatumia `Input`, `PasswordInput`, `Button`, `Alert` zilezile.
- Guards mbili (Protected/PublicOnly) zinashiriki `useAuth` + `FullPageLoader`.
- Import paths zote zinatumia alias `@/` (hakuna `../../../`).

**Uthibitisho:** `tsc -b` ✓ | `vite build` ✓ | `oxlint` = 0 warnings, 0 errors | File kubwa = mistari 81.

---

## 8. Uko tayari kwa Phase inayofuata?

**NDIYO.** Msingi wa auth + RBAC + multi-tenancy umewekwa. Phase 2 (Dashboard) itatumia:
- `useAuth()` kupata session + permissions
- `ProtectedRoute` kulinda dashboard
- `company_id` + RLS kwa data isolation
- Reusable UI components zilizopo

### Setup ya kuendesha
1. Tengeneza Supabase project → nakili URL + anon key kwenye `.env`
2. Endesha migrations: `supabase/migrations/0001_*.sql` kisha `0002_*.sql`
3. Washa Email confirmation + MFA (TOTP) kwenye Supabase Auth settings
4. `npm install && npm run dev`

**Simama hapa. Subiri maelekezo ya kuendelea Phase 2.**
