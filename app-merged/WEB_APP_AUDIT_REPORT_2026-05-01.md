# Web App Audit Report

Date: 2026-05-01  
Scope: `backend` (Laravel API) + `frontend` (React/Vite SPA)

## Executive Summary

The application shows strong progress toward production readiness: role-based authorization is centralized, API error handling is standardized, route modularization is in place, and dependency vulnerability scans are currently clean.  

The main remaining risks are operational hardening and maintainability: no visible CI workflow, partial role-policy mismatch between frontend navigation and backend authorization, and limited project-level operational documentation.

## What Was Audited

- Backend architecture and config:
  - `backend/bootstrap/app.php`
  - `backend/routes/api.php` + `backend/routes/api/*.php`
  - `backend/app/Http/Middleware/CheckRole.php`
  - `backend/config/cors.php`
  - `backend/config/sanctum.php`
  - `backend/.env.example`
  - `backend/composer.json`
- Frontend architecture and config:
  - `frontend/src/App.tsx`
  - `frontend/src/layouts/DashboardLayout.tsx`
  - `frontend/src/lib/axios.ts`
  - `frontend/vite.config.ts`
  - `frontend/package.json`
  - `frontend/README.md`
- Dependency security scans:
  - `composer audit --format=plain`
  - `npm audit --omit=dev --json`

## Security Posture

### Strengths

- Laravel API has explicit middleware aliases and API-specific exception rendering returning JSON responses (`401`, `403`, `404`, `422`, `500`) in `backend/bootstrap/app.php`.
- Role middleware logic is centralized in `backend/app/Http/Middleware/CheckRole.php` with:
  - canonical allowed roles
  - alias mapping (`trainer`, `student`)
  - malformed role configuration protection.
- Frontend token strategy uses in-memory access token (not localStorage), reducing persistence of tokens to XSS exposure windows (`frontend/src/lib/axios.ts`).
- Production HTTPS guard is enforced for frontend API URL in `frontend/vite.config.ts` and `frontend/src/lib/axios.ts`.
- CORS is not wildcard-open by default and supports explicit origin configuration via env (`backend/config/cors.php`).

### Findings

#### Medium

1. Missing CI/CD workflow definitions in repository root (`.github/workflows` not found).  
   **Risk:** Security, lint, and test checks depend on local discipline and may regress silently.  
   **Recommendation:** Add CI pipelines for:
   - backend tests + static checks
   - frontend lint/build/test
   - dependency audit gates.

2. Sanctum stateful domain defaults may not match active Vite dev ports (`5173+`) unless environment overrides are provided (`backend/config/sanctum.php`).  
   **Risk:** Inconsistent auth behavior across environments (especially cookie/session flows).  
   **Recommendation:** Define `SANCTUM_STATEFUL_DOMAINS` explicitly for all active frontend origins in each environment.

#### Low

3. Frontend navigation role visibility is narrower than backend route authorization in some entries (example: timetable nav roles differ from API role allowances) in `frontend/src/layouts/DashboardLayout.tsx`.  
   **Risk:** UX inconsistency (authorized users may not see links for endpoints they can access).  
   **Recommendation:** Centralize role matrices and reuse them in both route guards and navigation visibility.

4. `frontend/README.md` remains template-level and does not document real app setup/architecture.  
   **Risk:** Slower onboarding, environment drift, and inconsistent runbooks.  
   **Recommendation:** Replace with project-specific docs (local setup, env contracts, auth flow, deployment checklist).

## Architecture & Code Quality Review

### Positive Signals

- Route modularization improves maintainability (`backend/routes/api/*.php` with loader in `backend/routes/api.php`).
- Frontend routes use `ProtectedRoute` + `RoleRoute` patterns in `frontend/src/App.tsx`.
- Explicit chunk splitting and production performance controls are present in `frontend/vite.config.ts`.
- Backend has non-trivial feature/authorization tests (`backend/tests/Feature/*`).

### Maintainability Risks

- Core API surface remains broad (many concerns in `backend/routes/api/core.php`), which can grow into a new monolith if not further domain-split.
- Some role definitions are duplicated between frontend guards/navigation and backend middleware strings, increasing drift risk.

## Dependency Audit Results

- Backend (`composer audit`): **No known vulnerabilities found**.
- Frontend (`npm audit --omit=dev`): **0 vulnerabilities** (prod dependencies).

## Priority Action Plan

### P1 (Immediate)

- Add CI workflows for:
  - backend: `php artisan test`, lint/style checks
  - frontend: `npm run lint`, `npm run build`
  - dependency security checks (`composer audit`, `npm audit`).
- Normalize Sanctum and CORS environment contracts across local/staging/production.

### P2 (Next Sprint)

- Extract centralized RBAC role matrix shared across frontend nav/guards and backend policy references.
- Further split `backend/routes/api/core.php` into additional domain modules (attendance, notifications, exports, commerce, etc.).

### P3 (Stabilization)

- Replace template docs with production runbooks:
  - setup
  - incident recovery basics
  - deployment and rollback
  - environment variable specification.

## Audit Conclusion

The app is in a solid intermediate-to-advanced state with clean dependency posture and good security foundations. The biggest gains now come from delivery hardening (CI), consistency hardening (RBAC source-of-truth), and maintainability hardening (deeper domain modularization + real operational docs).
