# Copilot instructions for web-dogcatify

## Project snapshot
- Vite + React + TypeScript app with TailwindCSS (see [package.json](package.json), [src/main.tsx](src/main.tsx), [src/index.css](src/index.css)).
- Auth and data access are Supabase-first; all data reads/writes go through the client in [src/lib/supabase.ts](src/lib/supabase.ts).
- Role-based web UI: public routes (landing/legal/login) and protected dashboard routes (admin/partner) in [src/App.tsx](src/App.tsx).

## Architecture & data flow
- Auth state lives in `AuthContext` (session -> profile -> role) in [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx). `getUserRole()` in [src/lib/supabase.ts](src/lib/supabase.ts) derives `admin|partner|owner`.
- `ProtectedRoute` guards `/dashboard` and redirects to `/login` when unauthenticated (see [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx)).
- `Dashboard` switches UI by role: admin -> `AdminDashboard`, partner -> `PartnerDashboard` (see [src/components/Dashboard.tsx](src/components/Dashboard.tsx)).
- Admin UI sections are modularized under [src/components/admin/](src/components/admin/) and selected by `activeSection` in [src/components/AdminDashboard.tsx](src/components/AdminDashboard.tsx).
- Partner UI sections live under [src/components/partner/](src/components/partner/) and are switched similarly in [src/components/PartnerDashboard.tsx](src/components/PartnerDashboard.tsx).

## Service layer patterns
- Service modules encapsulate Supabase queries and business logic under [src/services/](src/services/). Examples:
  - `dashboardService` aggregates metrics and chart data with multiple parallel queries in [src/services/dashboard.service.ts](src/services/dashboard.service.ts).
  - `auditService` writes to `audit_logs` and provides helpers `logAction`, `logError` in [src/services/audit.service.ts](src/services/audit.service.ts).
  - Alerts rely on `admin_settings` + `audit_logs` thresholds and send email via Supabase edge function `send-email` (see [src/services/alerts.service.ts](src/services/alerts.service.ts)).
  - Booking/order updates compute IVA + commission and sync orders/bookings (see [src/services/admin.service.ts](src/services/admin.service.ts) and [src/services/partner.service.ts](src/services/partner.service.ts)).

## External integrations
- Supabase env vars are required at startup: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see [src/lib/supabase.ts](src/lib/supabase.ts)).
- Edge functions live under [supabase/functions/](supabase/functions/) (e.g., `create-payment-link`, `mercadopago-webhook`, `check-alert-thresholds`), and are called by services via fetch with `Authorization: Bearer <session access_token>`.
- Database schema & triggers are tracked in [supabase/migrations/](supabase/migrations/).

## Dev workflows
- `npm run dev` starts Vite dev server.
- `npm run build` for production build; `npm run preview` to serve build.
- `npm run lint` runs ESLint (no unit test scripts present).

## Conventions to follow
- Use service modules for Supabase access; components should call services instead of embedding raw queries.
- Reuse audit logging helpers (`logAction`, `logError`) for user-facing actions (see [src/components/Login.tsx](src/components/Login.tsx) and [src/components/AdminDashboard.tsx](src/components/AdminDashboard.tsx)).
- UI text is Spanish (es-UY), and date formatting often uses `toLocaleDateString('es-UY', ...)` (see [src/services/dashboard.service.ts](src/services/dashboard.service.ts)).
