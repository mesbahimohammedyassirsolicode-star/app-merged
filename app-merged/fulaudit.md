# Full Application Audit - app-merged

Date: 2026-04-30  
Audited stack: Laravel API (`backend`) + React/Vite client (`frontend`)

## 1) Audit Scope

This audit covers:

- Backend architecture and security posture (controllers/services/policies/routes/middleware)
- Frontend architecture and API/session handling
- Authorization boundaries and object-scoped access risks
- Transport/session hardening
- Test coverage and delivery-readiness
- Operational and maintainability risks

## 2) Executive Summary

Overall, the application has a strong baseline with role middleware, Sanctum auth, policy usage in parts of the codebase, and meaningful backend security tests.  
However, risk concentration is still high in object-level authorization consistency and transport/session hardening choices.

Finding totals:

- Critical: 0
- High: 2
- Medium: 6
- Low: 3

Audit verdict:

- **Current state:** workable for internal/staging use with strong foundations
- **Production readiness:** conditional, requires High findings remediation before release

## 3) Architecture Review

### Backend (Laravel)

Observed strengths:

- Clear layered directories (`Http`, `Services`, `Policies`, `Models`, `Requests`, `Resources`)
- Role middleware (`role:*`) is broadly applied
- Sanctum-based authenticated route envelope in `routes/api.php`
- Existing security-focused tests in `tests/Feature`

Observed risks:

- `routes/api.php` is very large and centralizes many domains, increasing RBAC drift risk
- Some controller flows still include business/scope logic that should be service-driven
- Role model/source consistency must remain strictly enforced (`users.role` vs related roles)

### Frontend (React)

Observed strengths:

- Centralized axios client with request/response interceptors
- In-memory access token pattern (better than `localStorage`)
- Route-level role gating and auth context patterns are present

Observed risks:

- API base URL fallback uses `http://` by default
- `withCredentials: true` + bearer token flow requires explicit contract and discipline
- API client abstractions appear split across multiple folders, which can cause drift

## 4) Security Findings (Prioritized)

### High

1. Object-level authorization may still be broader than intended on some scoped endpoints
- Area: backend authorization boundaries
- Evidence sources: existing pentest/audit reports and high-risk endpoint map (`stages`, `students/{id}/report`, `timetable-data`, `course-files`)
- Risk: horizontal access across teacher/formateur/filiere scope
- Required fix: enforce policy + service scope checks on every object read/write path, with deny-by-default behavior

2. Frontend transport defaults allow insecure API configuration in non-local contexts
- Area: frontend transport/security defaults
- Evidence: `frontend/src/lib/axios.ts` uses `http://localhost:8000/api` fallback and `withCredentials: true`
- Risk: accidental insecure deployment settings, credential/token exposure on non-TLS networks
- Required fix: enforce HTTPS in non-local environments and block non-HTTPS production API URLs in CI

### Medium

3. Route surface is monolithic and difficult to reason about safely
- Area: backend routing and RBAC maintainability
- Evidence: single large `backend/routes/api.php`
- Risk: policy inconsistency and accidental overexposure as features grow
- Recommended fix: split route files by domain and keep role matrices close to bounded contexts

4. FormRequest-first discipline is not consistently applied on mutable endpoints
- Area: validation architecture
- Risk: inconsistent validation/authorization behavior across controllers
- Recommended fix: migrate mutable actions to typed FormRequest + authorize rules

5. Service-layer object scope enforcement is not uniformly centralized
- Area: authorization architecture
- Risk: controller-level checks are easier to bypass/regress than shared services
- Recommended fix: centralize scope decisions in dedicated security/access services

6. Security telemetry is not defined as a strict, shared standard everywhere
- Area: detection and incident response
- Risk: weak forensic traceability for allow/deny decisions on sensitive routes
- Recommended fix: structured security event schema (actor, target, decision, reason, request_id)

7. Upload hardening needs defense-in-depth beyond MIME/extension checks
- Area: file handling
- Risk: disguised payloads and unsafe downstream handling
- Recommended fix: quarantine-first workflow, signature/MIME verification, AV/CDR scan gate, safe download headers

8. Abuse-prone endpoints need stronger endpoint-specific throttles
- Area: anti-automation
- Risk: spam/flooding/noise that can mask malicious activity
- Recommended fix: route-specific limiter profiles for feedback/messages/report reads/writes

### Low

9. Frontend can expose raw technical error detail to users in some flows
- Risk: minor information disclosure
- Recommendation: generic user-facing messages + internal telemetry detail only

10. Frontend test coverage is not clearly established
- Risk: regression risk in auth, routing, and error flows
- Recommendation: add Vitest/RTL baseline suites for auth/session and critical pages

11. Operational scripts and helper files should be hardened by deployment policy
- Risk: accidental exposure/execution in production environments
- Recommendation: enforce deploy allowlist, deny public access to non-runtime utility scripts, and tighten build packaging

## 5) What Is Working Well

- Authenticated API envelope with `auth:sanctum`
- Broad role middleware usage and role alias handling
- In-memory token strategy on frontend (reduced XSS token persistence risk)
- Existing backend security-oriented feature tests
- Security awareness already documented in project audit/checklist reports

## 6) Test and Quality Gaps

Priority gaps:

- Cross-scope deny tests for all object endpoints (not only selected ones)
- Dedicated tests for auth mode contract (token-only vs cookie+CSRF behavior)
- Upload security regression tests (quarantine + scan gating)
- Route-specific rate limit tests (`429` behavior)
- Frontend integration tests for 401 handling and auth lifecycle

## 7) Production Risk Rating

- Confidentiality risk: **High** (if object scoping gaps remain)
- Integrity risk: **High** (if unauthorized update paths remain)
- Availability risk: **Medium** (abuse/flood without strict endpoint throttles)
- Maintainability risk: **Medium** (route/controller complexity and architecture drift)

## 8) Remediation Roadmap

### Phase 1 (0-3 days) - Release blockers

- Fix all High findings:
  - enforce strict object-level authorization checks on sensitive endpoints
  - enforce HTTPS-only non-local API config in frontend and CI
- Add negative regression tests for each fixed endpoint

### Phase 2 (3-10 days) - Security hardening

- Standardize FormRequest + policy + service-scope flow for mutable actions
- Add structured security event logging schema and alert hooks
- Introduce endpoint-specific throttling profiles

### Phase 3 (1-3 weeks) - Structural quality

- Split monolithic route file into domain route modules
- Consolidate frontend API abstraction into one canonical layer
- Add frontend test stack and baseline integration tests

### Phase 4 (ongoing) - Operational maturity

- CI security gates (policy test requirements, secret scanning, dependency auditing)
- Recurring defensive simulations and security regression cadence
- Dashboarding for anomalous access patterns and repeated authorization denials

## 9) Definition of Done for Security-Critical Endpoints

An endpoint is considered production-secure only when all conditions pass:

- Validation is enforced with FormRequest
- Object policy authorization is explicit
- Service-layer scope guard is authoritative
- Structured allow/deny security event is logged
- Route-specific throttle profile exists
- Positive and negative feature tests pass in CI

## 10) Final Recommendation

Do not treat the app as fully production-ready until High findings are closed and regression-tested.  
After those fixes, the codebase can progress safely with a short hardening cycle focused on route modularization, scope centralization, and stronger telemetry-driven monitoring.
