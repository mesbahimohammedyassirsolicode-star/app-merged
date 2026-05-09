# Full App Audit Report

## Scope

Security and architecture audit of:
- `backend` (Laravel API)
- `frontend` (React SPA)

Focus areas:
- Authentication and authorization
- Validation and API design discipline
- Transport and session security
- Data exposure and error handling
- Frontend reliability risks with security implications
- Test coverage for critical security paths

## Executive Summary

- Total findings: **9**
- Critical: **0**
- High: **2**
- Medium: **5**
- Low: **2**

The codebase has a solid foundation (route middleware, policy usage, private file storage, and security-oriented tests), but there are high-priority gaps around **authorization scope** and **HTTP transport defaults** that should be fixed first.

## Prioritized Findings

### High

1. **Course-file authorization may be broader than intended**
   - Area: Backend authorization
   - Evidence: `backend/app/Services/CourseFileService.php`
   - Risk: Possible cross-group read/upload if a teacher is not explicitly assigned to the group.
   - Recommendation: Require explicit teacher-group (or module+group) assignment for group-scoped file access and publication. Add regression tests.

2. **Frontend API defaults to HTTP while using credentialed requests**
   - Area: Transport security
   - Evidence: `frontend/src/lib/axios.ts`, `frontend/.env`
   - Risk: Cookie/token exposure outside local environments.
   - Recommendation: Enforce HTTPS in non-local environments and add CI checks to block `http://` production API URLs.

### Medium

3. **FormRequest usage is inconsistent**
   - Area: Backend validation architecture
   - Evidence: `backend/app/Http/Controllers/UserController.php`, `backend/app/Http/Controllers/ModuleController.php`
   - Risk: Validation/authorization drift and inconsistent error contracts.
   - Recommendation: Move mutable endpoint validation and authorization into dedicated FormRequest classes.

4. **Business logic remains in controllers**
   - Area: Backend maintainability/security posture
   - Evidence: `backend/app/Http/Controllers/GroupController.php`
   - Risk: Harder to maintain and easier to introduce policy bypass regressions.
   - Recommendation: Extract query/scoping logic to service/query classes. Keep controllers thin.

5. **CSRF/auth flow is not explicit in frontend**
   - Area: Frontend auth/session contract
   - Evidence: `frontend/src/lib/axios.ts`, `frontend/src/api/authService.ts`
   - Risk: Ambiguous auth mode can cause fragile behavior or CSRF protection gaps.
   - Recommendation: Standardize to one auth model (token-only or cookie+CSRF) and implement explicit CSRF initialization if cookie mode is used.

6. **State updates during render in core frontend flows**
   - Area: Frontend reliability
   - Evidence: `frontend/src/hooks/useAttendance.ts`, `frontend/src/pages/ModulesPage.tsx`
   - Risk: Rerender loops and instability in core workflows.
   - Recommendation: Move render-time `setState` into `useEffect`/`useMemo` or use reducer-driven state transitions.

7. **Duplicated API service layers**
   - Area: Frontend architecture
   - Evidence: `frontend/src/api/*`, `frontend/src/services/*`
   - Risk: Security fixes can diverge across parallel abstractions.
   - Recommendation: Consolidate into one canonical API layer.

### Low

8. **Raw exception message shown in UI**
   - Area: Frontend error disclosure
   - Evidence: `frontend/src/components/ErrorBoundary.tsx`
   - Risk: Potential leakage of internal details to users.
   - Recommendation: Display generic user-safe message and keep details in logs/telemetry.

9. **Local `.env` includes key material**
   - Area: Secret hygiene
   - Evidence: `backend/.env`
   - Risk: Operational leakage if shared accidentally.
   - Recommendation: Keep untracked, rotate if exposed, and add secret scanning in CI.

## Positives Observed

- Route-level auth/role middleware is broadly present.
- Policy-based authorization exists on sensitive domains.
- File upload pipeline uses allowlists/limits with private storage.
- Frontend avoids storing auth token in `localStorage`.
- Security-focused backend tests already cover important isolation paths.

## Test Gaps

- No clear dedicated tests for CORS behavior.
- No explicit CSRF/session-cookie contract tests.
- Missing strict regression tests for teacher group scoping in course-file access.
- Limited assertions for structured security telemetry/logging behavior.

## Remediation Roadmap

### Immediate (1-3 days)
- Enforce HTTPS for non-local API traffic in frontend configuration.
- Tighten `CourseFileService` authorization checks to explicit assignment rules.
- Replace raw user-facing exception messages with generic safe messaging.

### Short term (3-7 days)
- Add backend regression tests for strict teacher/group course-file scope.
- Standardize auth mode contract and implement CSRF bootstrap if cookie mode is retained.

### Medium term (1-2 weeks)
- Consolidate duplicated frontend API layers.
- Migrate mutable endpoints to FormRequest-first pattern.

### Structural (2-3 weeks)
- Refactor controller-heavy flows into dedicated service/query classes.
- Add CI security pipeline checks (`npm audit`, secret scanning, policy checks for env safety).

## Suggested Next Actions

1. Fix the 2 High findings first.
2. Add regression tests immediately after each fix.
3. Run a focused re-audit of authz + transport + CSRF paths after remediation.
