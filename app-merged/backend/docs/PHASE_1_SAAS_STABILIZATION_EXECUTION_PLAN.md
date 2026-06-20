# Phase 1 SaaS Stabilization Execution Plan

## Scope
This document converts the audit findings into an execution sequence for the Phase 1 priorities:

1. Global Error Boundaries
2. EvaluationPolicy implementation
3. Attendance schema normalization
4. Axios auth race-condition fix
5. Dashboard widget architecture
6. Role-based UI protection cleanup
7. Bulk operation optimization with `upsert()`
8. Skeleton loading system
9. Notification architecture cleanup
10. Shared reusable component system

## Task 1: Global Error Boundaries
Problem: the frontend had two different boundary implementations, duplicated toast behavior, and a missing `ErrorBoundary` import in the main app shell.

Architecture goal: one production-safe boundary primitive, one global shell boundary, and optional page/widget boundaries for isolation.

File plan:
- `frontend/src/components/ui/error-boundary.tsx`
- `frontend/src/components/ErrorBoundary.tsx`
- `frontend/src/App.tsx`
- `frontend/src/main.tsx`

Folder structure:
```text
frontend/src/components/
  ErrorBoundary.tsx
  ui/
    error-boundary.tsx
```

Implementation steps:
1. Keep `ui/error-boundary.tsx` as the canonical implementation.
2. Turn `components/ErrorBoundary.tsx` into a compatibility re-export.
3. Use one global app-shell boundary in `App.tsx`.
4. Remove duplicate wrapping in `main.tsx`.

Migration steps:
1. No DB migration required.
2. Deploy with frontend bundle only.

Risks:
- Over-broad reset behavior can hide route-level issues.

Rollback:
1. Restore the old wrapper in `main.tsx`.
2. Revert the re-export if any legacy import path depends on custom class behavior.

Scalability impact: lowers shell crash blast radius and standardizes future widget/page isolation.

## Task 2: EvaluationPolicy Implementation
Problem: evaluation authorization was split across controller-private methods, making policy drift likely and tests harder to trust.

Architecture goal: policy-driven object authorization with a model scope for list filtering.

File plan:
- `backend/app/Policies/EvaluationPolicy.php`
- `backend/app/Models/Evaluation.php`
- `backend/app/Http/Controllers/EvaluationController.php`
- `backend/app/Providers/AppServiceProvider.php`
- `backend/tests/Feature/RoleIsolationTest.php`
- `backend/tests/Feature/SecurityIsolationTest.php`

Folder structure:
```text
backend/app/
  Models/Evaluation.php
  Policies/EvaluationPolicy.php
  Http/Controllers/EvaluationController.php
```

Implementation steps:
1. Introduce `EvaluationPolicy`.
2. Register the policy explicitly in `AppServiceProvider`.
3. Add `Evaluation::scopeVisibleTo()` for list queries.
4. Replace controller-local `assert*` authorization logic with `authorize()`.
5. Keep teacher/student/parent compatibility semantics unchanged.

Migration steps:
1. No DB migration required.
2. Run evaluation and security feature tests before deploy.

Risks:
- Hidden dependencies on the deleted controller-private authorization helpers.

Rollback:
1. Revert the controller to legacy `assertCanViewEvaluation()` flow.
2. Remove `Gate::policy(Evaluation::class, ...)`.

Scalability impact: central policy logic reduces authorization drift as more grade endpoints are added.

## Task 3: Attendance Schema Normalization
Problem: `attendances` still carries mixed V1/V2 semantics (`retard`, `late`, `retard_minutes`, `minutes_late`, duplicated scope columns).

Architecture goal: preserve backward compatibility while enforcing one canonical write contract around:
- `status in [present, absent, late]`
- `minutes_late` as canonical delay field
- indexed teacher/group/module/date access paths

File plan:
- `backend/database/migrations/2026_05_10_190000_normalize_attendance_write_contract.php`
- `backend/app/Models/Attendance.php`
- `backend/app/Services/AttendanceService.php`
- `backend/tests/Feature/AttendanceApiTest.php`

Folder structure:
```text
backend/database/migrations/
  2026_05_10_190000_normalize_attendance_write_contract.php
```

Implementation steps:
1. Normalize `retard` to `late`.
2. Backfill `minutes_late` from `retard_minutes`.
3. Backfill `retard_minutes` from `minutes_late` for legacy readers.
4. Add composite indexes for operational queries.
5. Keep old columns until Phase 2 removes them behind feature verification.

Migration steps:
1. Run migration in staging.
2. Compare row counts by status before and after.
3. Validate daily attendance, dashboard, and report endpoints.

Risks:
- Existing duplicate indexes in some environments may make the migration fail.

Rollback:
1. Drop new indexes.
2. Revert service-level writes to legacy-only fields if dashboards regress.

Scalability impact: cleaner status semantics and better query indexes improve attendance reporting and dashboard aggregation.

## Task 4: Axios Auth Race-Condition Fix
Problem: concurrent `401` responses could trigger duplicate logout behavior and auth shell churn.

Architecture goal: one unauthorized event dispatch per incident, reset only after successful auth recovery.

File plan:
- `frontend/src/lib/auth-events.ts`
- `frontend/src/lib/axios.ts`
- `frontend/src/context/AuthContext.tsx`

Folder structure:
```text
frontend/src/lib/
  axios.ts
  auth-events.ts
```

Implementation steps:
1. Introduce a tiny auth event bus with a one-shot unauthorized latch.
2. Dispatch unauthorized only for non-auth endpoints.
3. Reset the latch after successful `getMe()` or login token set.

Migration steps:
1. No DB changes.
2. Validate login, refresh, expired session, and multi-request page loads.

Risks:
- If the backend starts returning `401` from a non-terminal endpoint, users may still be logged out.

Rollback:
1. Revert to direct event dispatch in `axios.ts`.

Scalability impact: prevents request storms from causing duplicated auth teardown under load.

## Task 5: Dashboard Widget Architecture
Problem: dashboards are role-switched page components, not a composable widget registry.

Architecture goal: widget-driven dashboards with role manifests, isolated loading/error states, and contract-based payload slices.

File plan:
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/components/dashboard/*`
- `frontend/src/services/dashboardService.ts`
- `backend/app/Strategies/Dashboard/*`

Target structure:
```text
frontend/src/components/dashboard/
  widgets/
    AttendanceRiskWidget.tsx
    QuickActionsWidget.tsx
    RecentAbsencesWidget.tsx
  registry.ts
  contracts.ts
```

Implementation steps:
1. Define typed widget contracts by role.
2. Move each dashboard section into an independent widget.
3. Create per-role widget manifests.
4. Introduce widget-level skeleton and boundary wrappers.

Migration steps:
1. Introduce widgets behind parity snapshots.
2. Roll role by role starting with admin.

Risks:
- UI regressions if backend payload normalizers stay loose.

Rollback:
1. Keep current role page components available behind a feature flag.

Scalability impact: new widgets can ship without rewriting whole role dashboards.

## Task 6: Role-Based UI Protection Cleanup
Problem: role checks are duplicated between route guards, navigation visibility, and page internals.

Architecture goal: central frontend authorization primitives that mirror backend policy/permission semantics.

File plan:
- `frontend/src/App.tsx`
- `frontend/src/layouts/DashboardLayout.tsx`
- `frontend/src/lib/rbac.ts`
- `frontend/src/components/layout/Sidebar.tsx`

Implementation steps:
1. Centralize route + nav guard evaluation into shared selectors.
2. Replace ad hoc role arrays with named capability maps.
3. Align aliases (`teacher/formateur`, `student/stagiaire`) consistently.

Migration steps:
1. Refactor route config first.
2. Move nav items to a single permission-aware registry.

Risks:
- Frontend can accidentally hide valid routes for aliased roles.

Rollback:
1. Revert to explicit route-local role arrays.

Scalability impact: reduces permission drift as the product surface grows.

## Task 7: Bulk Operation Optimization with `upsert()`
Problem: row-by-row attendance and note writes do not scale under large class sizes.

Architecture goal: set-based writes with deterministic unique keys and chunked persistence.

File plan:
- `backend/app/Services/AttendanceService.php`
- `backend/app/Http/Controllers/EvaluationController.php`
- future Phase 1 follow-up:
  - `backend/database/migrations/*_add_unique_index_to_notes.php`

Implementation steps:
1. Convert attendance session writes to batched `upsert()`.
2. Convert evaluation note writes to `upsert()` using existing ids.
3. Add a unique `(evaluation_id, stagiaire_id)` constraint in a follow-up migration before switching notes to conflict-target upserts.

Migration steps:
1. Verify current notes table for duplicates.
2. Clean duplicates.
3. Add the unique index.

Risks:
- `upsert()` semantics differ between MySQL and SQLite when conflict keys are weak.

Rollback:
1. Revert to `updateOrCreate()` for the affected endpoint.

Scalability impact: class-wide writes move from N inserts/updates to bounded chunked statements.

## Task 8: Skeleton Loading System
Problem: loading placeholders exist but are page-specific and not reusable enough for widgets/lists/stats.

Architecture goal: a small skeleton design system with composable variants.

File plan:
- `frontend/src/components/ui/loading-skeleton.tsx`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/components/dashboard/*`

Implementation steps:
1. Parameterize the existing skeleton counts.
2. Add widget/list/table variants.
3. Standardize page-level loading states on these primitives.

Migration steps:
1. Start with dashboard and notifications.
2. Expand to tables and detail screens.

Risks:
- Too many animated placeholders can increase paint cost on low-end devices.

Rollback:
1. Fall back to static card placeholders.

Scalability impact: consistent perceived performance and lower duplicated UI code.

## Task 9: Notification Architecture Cleanup
Problem: notification client modules are duplicated across `api/` and `services/`, and unread polling sits directly in the topbar button.

Architecture goal: one notification domain client, one query-key contract, one unread state source.

File plan:
- `frontend/src/api/api/notifications.ts`
- `frontend/src/services/api/notifications.ts`
- `frontend/src/components/layout/NotificationBell.tsx`
- `frontend/src/pages/NotificationsPage.tsx`
- `backend/app/Services/NotificationService.php`

Implementation steps:
1. Keep one notification client path and delete the duplicate import surface.
2. Introduce shared query keys for list/unread state.
3. Move unread polling into a reusable hook.
4. Normalize backend `type` and `data` payload contracts.

Migration steps:
1. Refactor imports first.
2. Then move unread polling to a hook.

Risks:
- Duplicate imports can silently survive and fork cache keys.

Rollback:
1. Restore the duplicated client temporarily while preserving the hook contract.

Scalability impact: supports real-time or SSE/WebSocket notifications later without view-layer rewrites.

## Task 10: Shared Reusable Component System
Problem: the frontend has useful primitives, but the app still mixes page-local styling decisions with core UI patterns.

Architecture goal: shared app-shell and domain UI primitives with one composition style.

File plan:
- `frontend/src/components/ui/*`
- `frontend/src/components/layout/*`
- `frontend/src/components/dashboard/*`
- `frontend/src/lib/utils.ts`

Target structure:
```text
frontend/src/components/
  ui/
    button.tsx
    card.tsx
    empty-state.tsx
    error-boundary.tsx
    loading-skeleton.tsx
  feedback/
  data-display/
  dashboard/widgets/
```

Implementation steps:
1. Freeze base primitives.
2. Extract domain primitives from dashboard/layout pages.
3. Replace repeated card/header/list compositions with shared components.

Migration steps:
1. Standardize the dashboard first.
2. Then apply to notifications, groups, and evaluations.

Risks:
- Over-abstraction can slow delivery if primitives are introduced before patterns stabilize.

Rollback:
1. Keep domain components thin and reversible.

Scalability impact: lowers UI drift and speeds future feature delivery.

## Immediate sequence
1. Deploy policy + auth shell + attendance write contract changes to staging.
2. Run backend feature tests for attendance, evaluation, and security boundaries.
3. Run frontend build and regression smoke for login, dashboard, attendance, evaluations, notifications.
4. Roll out widget, notification, and reusable-component refactors behind parity-focused increments.
