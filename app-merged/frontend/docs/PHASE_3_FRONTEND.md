# Phase 3: Frontend Application (React) — Summary

**Stack:** React 18+, Vite, Tailwind CSS, TanStack Query, TanStack Table (ready), React Router v6/v7, React Hook Form + Zod, Sonner (toast), react-i18next (French).

## Structure

- **API client:** `src/lib/axios.ts` — base URL `/api/v1`, Bearer token, 401 → redirect to `/login`.
- **API helpers:** `src/lib/api.ts` — `unwrapData`, `unwrapMeta` for `{ data, meta }` responses.
- **Services:** `src/services/api/*` — academicStructure, groups, modules, affectations, seances, evaluations, stages, feedback, notifications, parent.
- **Pages:** `src/pages/` — Dashboard, Academic (years, filières), Groups (list + detail), Modules, Affectations, Attendance (list + roll-call), Evaluations, Stages, Feedback, Notifications, Parent (children + child detail).
- **Layout:** `src/layouts/DashboardLayout.tsx` — sidebar nav by role (admin, formateur, stagiaire, parent), logout.
- **Auth:** `src/context/AuthContext.tsx` — login, logout, me; token in localStorage; `authService` uses API v1 response shape.
- **i18n:** `src/i18n/index.ts` — French (common, auth, nav, app).
- **Error handling:** `src/components/ErrorBoundary.tsx` — class component, toast on error, “Réessayer” button.
- **Toasts:** Sonner in `main.tsx`.

## Routes (under protected layout)

- `/dashboard` — Dashboard
- `/users` — Users (admin)
- `/academic/years`, `/academic/filieres` — Academic structure
- `/groups`, `/groups/:id` — Groups
- `/modules` — Modules
- `/affectations` — Affectations
- `/attendance` — Séances list
- `/attendance/seances/:id` — Roll-call (attendances)
- `/evaluations` — Evaluations
- `/stages` — Stages
- `/feedback` — Anonymous feedback form
- `/notifications` — Notifications
- `/parent/children` — Parent: list children
- `/parent/children/:id` — Parent: child detail (grades + attendance summary)

## Role-based nav

- **Admin:** all links (users, years, filières, groups, modules, affectations, attendance, evaluations, stages, feedback, notifications).
- **Formateur / Stagiaire:** same without “Utilisateurs” and “Années / Filières” (or adjust as needed).
- **Parent:** Tableau de bord, Mes enfants, Feedback, Notifications (and optionally limited groups/modules if backend allows).

## Build

- `npm run build` — succeeds (TypeScript + Vite).
- Set `VITE_API_URL` to the backend base (e.g. `http://localhost:8000/api`) if not default.
