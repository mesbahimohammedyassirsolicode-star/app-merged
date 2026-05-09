# Full Audit Implementation Tasks

Date: 2026-04-30  
Source: `fulaudit.md`

## Execution Model

- Priority order: P0 -> P1 -> P2 -> P3
- Each task must include code changes + tests + verification evidence
- No task is complete without negative authorization tests where relevant

## P0 - Release Blockers (Do First)

### BE-SEC-001 - Enforce strict object authorization on stage endpoints

- **Priority:** P0
- **Owner:** Backend
- **Scope:** `GET /api/v1/stages`, `GET /api/v1/stages/{stage}`, `PUT /api/v1/stages/{stage}`
- **Implementation:**
  - Add/verify `StagePolicy` methods: `viewAny`, `view`, `update`
  - Ensure controller methods call `$this->authorize(...)`
  - Move actor-scope filtering into a dedicated service (`StageAccessService`)
  - Enforce deny-by-default for out-of-scope records
- **Tests (required):**
  - Assigned teacher/formateur gets `200` on own records
  - Non-assigned teacher/formateur gets `403`
  - Unauthorized update attempt gets `403` and no data mutation
- **Acceptance criteria:**
  - All stage object reads/writes are policy + service scoped
  - Security regression tests pass in CI

### BE-SEC-002 - Enforce strict object authorization on report endpoint

- **Priority:** P0
- **Owner:** Backend
- **Scope:** `GET /api/v1/students/{id}/report`
- **Implementation:**
  - Add/verify policy method (e.g. `StudentPolicy@viewReport`)
  - Enforce assignment checks in service before PDF generation
  - Ensure parent/student/self scope logic is explicit and consistent
- **Tests (required):**
  - Parent accesses only linked children (`200`/`403`)
  - Student accesses self only (`200`/`403`)
  - Staff accesses assigned learners only (`200`/`403`)
- **Acceptance criteria:**
  - Out-of-scope report access always denied
  - No cross-student report leakage

### BE-SEC-003 - Lock timetable scope to authenticated actor context

- **Priority:** P0
- **Owner:** Backend
- **Scope:** `GET /api/v1/timetable-data`
- **Implementation:**
  - Create/upgrade `TimetableRequest` for strict input validation
  - Derive allowed filiere scope server-side from actor identity/assignments
  - Treat request selector params as hints, never authority
- **Tests (required):**
  - In-scope request returns `200`
  - Cross-scope request returns `403`
- **Acceptance criteria:**
  - No cross-filiere data disclosure via query parameter manipulation

### FE-SEC-001 - Enforce HTTPS API configuration in non-local environments

- **Priority:** P0
- **Owner:** Frontend + DevOps
- **Scope:** `frontend/src/lib/axios.ts`, env config and CI checks
- **Implementation:**
  - Keep localhost fallback for local dev only
  - Add runtime guard for non-local API URLs requiring `https://`
  - Add CI policy check that fails on non-local `http://` API URL
- **Tests (required):**
  - Config validation test for env URL parsing
  - CI check job verifies production/staging URL policy
- **Acceptance criteria:**
  - Non-local HTTP API config cannot pass pipeline

## P1 - Security Hardening

### BE-SEC-004 - Standardize FormRequest-first validation on mutable endpoints

- **Priority:** P1
- **Owner:** Backend
- **Scope:** all sensitive write endpoints (`stages`, reports-related mutations, timetable writes, course-files)
- **Implementation:**
  - Add/upgrade typed FormRequests with strict allowlists
  - Move authorization checks into request/policy where applicable
- **Tests (required):**
  - Validation rejects malformed and unauthorized payloads (`422`/`403`)
- **Acceptance criteria:**
  - No sensitive write endpoint performs ad-hoc inline validation only

### BE-SEC-005 - Add centralized structured security event logging

- **Priority:** P1
- **Owner:** Backend + Platform
- **Scope:** critical allow/deny actions on object endpoints
- **Implementation:**
  - Add dedicated security logging helper/channel
  - Include fields: `event_name`, `request_id`, `actor_id`, `actor_role`, `route`, `target_type`, `target_id`, `decision`, `reason`
  - Ensure PII/token-safe logging
- **Tests (required):**
  - Feature tests assert log event emission for allow and deny paths
- **Acceptance criteria:**
  - Critical authorization decisions are traceable for incident response

### BE-SEC-006 - Harden upload pipeline for course files

- **Priority:** P1
- **Owner:** Backend
- **Scope:** `POST /api/v1/course-files`, download behavior
- **Implementation:**
  - Add signature-aware MIME validation and strict allowlist
  - Implement quarantine-first upload state
  - Add AV/CDR scan gate before publish/download
  - Force safe headers (`Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`)
- **Tests (required):**
  - Disguised file is rejected/quarantined
  - Oversized file rejected
  - Unscanned file cannot be served
- **Acceptance criteria:**
  - Unsafe files cannot become publicly consumable

### BE-SEC-007 - Add endpoint-specific throttling profiles

- **Priority:** P1
- **Owner:** Backend
- **Scope:** `feedbacks`, `messages`, report-heavy reads, sensitive writes
- **Implementation:**
  - Define route-specific `RateLimiter::for(...)` profiles
  - Apply middleware on abuse-prone routes
  - Add actor/IP-aware keys
- **Tests (required):**
  - Burst requests return `429`
  - Limits reset correctly after window
- **Acceptance criteria:**
  - Abuse traffic is constrained without breaking normal usage

## P2 - Architecture and Maintainability

### BE-ARCH-001 - Split monolithic API routes into domain route files

- **Priority:** P2
- **Owner:** Backend
- **Scope:** `backend/routes/api.php`
- **Implementation:**
  - Create domain route files (auth, users, academics, attendance, grades, stages, files, messages, analytics, commerce)
  - Keep shared middleware groups centralized and explicit
- **Tests (required):**
  - Smoke tests for all migrated route prefixes
- **Acceptance criteria:**
  - Route ownership and RBAC are easier to audit and review

### FE-ARCH-001 - Consolidate duplicated API layers

- **Priority:** P2
- **Owner:** Frontend
- **Scope:** `frontend/src/api/*` and `frontend/src/services/*`
- **Implementation:**
  - Choose one canonical API layer structure
  - Migrate consumers and remove parallel duplicated wrappers
- **Tests (required):**
  - Contract tests for key API clients (auth, modules, stages, reports)
- **Acceptance criteria:**
  - Security fixes and interceptors are centralized and consistent

### FE-QUAL-001 - Add frontend test baseline for auth/session and route guards

- **Priority:** P2
- **Owner:** Frontend
- **Scope:** auth context, 401 handling, protected/role routes
- **Implementation:**
  - Add test runner (Vitest + React Testing Library)
  - Add tests for unauthorized redirect/event behavior
  - Add tests for route role gating and fallback states
- **Acceptance criteria:**
  - Core auth/session regressions are caught in CI

## P3 - Operational Security Maturity

### OPS-SEC-001 - Add CI security gates

- **Priority:** P3
- **Owner:** DevOps + Backend + Frontend
- **Scope:** CI workflow
- **Implementation:**
  - Enforce security-tagged backend tests
  - Add secret scanning
  - Add dependency audit checks
  - Add policy checks for environment safety constraints
- **Acceptance criteria:**
  - Build fails when security baseline rules regress

### OPS-SEC-002 - Add monitoring and anomaly dashboards

- **Priority:** P3
- **Owner:** Platform/SRE
- **Scope:** security telemetry from API
- **Implementation:**
  - Dashboards for sequential deny events, report download spikes, upload rejection spikes
  - Alert thresholds and incident runbook linkage
- **Acceptance criteria:**
  - Suspicious authz/access patterns generate actionable alerts

## Suggested Sprint Breakdown

### Sprint 1 (Week 1)

- BE-SEC-001
- BE-SEC-002
- BE-SEC-003
- FE-SEC-001

### Sprint 2 (Week 2)

- BE-SEC-004
- BE-SEC-005
- BE-SEC-006
- BE-SEC-007

### Sprint 3 (Week 3)

- BE-ARCH-001
- FE-ARCH-001
- FE-QUAL-001

### Sprint 4 (Week 4)

- OPS-SEC-001
- OPS-SEC-002

## Delivery Checklist (Per Task)

- [ ] Code implemented in correct layer (controller thin, service authoritative)
- [ ] Validation and authorization completed
- [ ] Positive and negative tests added
- [ ] Security logging included where required
- [ ] Documentation updated
- [ ] CI passing

## Release Gate

Do not release to production until all P0 tasks are completed and verified in CI with regression tests.
