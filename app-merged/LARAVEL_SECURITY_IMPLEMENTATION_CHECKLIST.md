# Laravel Security Implementation Checklist

Date: 2026-04-30  
Target stack: Laravel 10+ API (`backend`) + React client (`frontend`)

## Goal

Convert the red-team defensive findings into a production execution plan with clear ownership points in code:

- `Policy` authorization
- service-layer scope enforcement
- route middleware and throttling
- structured security logging
- feature tests for regressions

---

## 1) Security Architecture Baseline

## Mandatory principles

1. Role middleware is not sufficient. Every object endpoint must enforce object-level authorization.
2. Controllers stay thin: validate -> authorize -> delegate to service -> return resource/response.
3. Scope decisions are centralized in services (single source of truth).
4. Every allow/deny on sensitive endpoints emits a structured security event.
5. All high-risk routes have dedicated throttle profiles.

## Standard request flow (target)

1. `FormRequest` validation
2. policy check (`$this->authorize(...)`)
3. service call with authenticated actor context
4. resource response
5. security event logging

---

## 2) Endpoint-by-Endpoint Implementation Map

## A) `GET /api/v1/stages` and `GET /api/v1/stages/{stage}`

### Policies
- Create/update `StagePolicy`:
  - `viewAny(User $actor)`
  - `view(User $actor, Stage $stage)`
  - `update(User $actor, Stage $stage)`
  - `delete(User $actor, Stage $stage)` (if route exists)

### Controller changes
- In `StageController@index`: call `$this->authorize('viewAny', Stage::class);`
- In `StageController@show`: call `$this->authorize('view', $stage);`

### Service changes
- `StageAccessService` (or equivalent):
  - `scopeVisibleStages(User $actor, Builder $query): Builder`
  - `canAccessStage(User $actor, Stage $stage): bool`
- Ensure all list queries are scoped by actor assignment, not client-supplied filters.

### Logging
- Emit event `security.stage.access` with:
  - `actor_id`, `actor_role`, `target_stage_id`, `decision`, `reason`, `request_id`.

### Tests
- Feature tests:
  - assigned teacher gets `200`
  - non-assigned teacher gets `403`
  - admin/directeur role behavior per business rules

---

## B) `PUT /api/v1/stages/{stage}`

### Policies
- Reuse `StagePolicy@update`.

### Validation
- Add `UpdateStageRequest` with strict field allowlist for mutable attributes.

### Controller changes
- `StageController@update`:
  - typed request + `$this->authorize('update', $stage)`
  - delegate mutation to `StageService`.

### Service changes
- `StageService@updateStage(User $actor, Stage $stage, array $data)`:
  - enforce transition rules for sensitive fields (status workflow).
  - reject unauthorized transitions even if policy passes role-level checks.

### Logging
- Event `security.stage.update` with before/after snapshot hash and changed keys.

### Tests
- unauthorized actor cannot mutate foreign stage (`403`)
- authorized actor can update allowed fields only
- forbidden transition returns `422` or `403` per design

---

## C) `GET /api/v1/students/{id}/report`

### Policies
- Add `StudentPolicy@viewReport(User $actor, Student $student)`.

### Controller changes
- Resolve `Student` by route model binding.
- Call `$this->authorize('viewReport', $student);`
- Delegate PDF generation access check to service before rendering.

### Service changes
- `StudentReportService@generateFor(User $actor, Student $student)`.
- Assignment verification must be service-enforced, not controller-only.

### Logging
- Event `security.student.report_access`:
  - include response size category and latency for anomaly detection.

### Rate limiting
- Add strict limiter for report endpoint (low burst, low sustained).

### Tests
- teacher only accesses assigned students
- parent only accesses linked children
- student only accesses self report
- out-of-scope always `403`

---

## D) `GET /api/v1/timetable-data?filiere_code=...`

### Validation
- Add `TimetableRequest`:
  - validate date/window parameters
  - treat `filiere_code` as optional hint, not authority.

### Service changes
- `TimetableAccessService@getTimetableFor(User $actor, array $params)`:
  - derive allowed filiere(s) from actor identity/assignments.
  - reject mismatches with `403`.

### Controller changes
- no direct query logic in controller.

### Logging
- Event `security.timetable.scope_check` with requested vs effective scope.

### Tests
- student requesting foreign filiere gets `403`
- actor receives only own allowed timetable data

---

## E) `POST /api/v1/course-files`

### Validation
- Add/upgrade `StoreCourseFileRequest`:
  - strict MIME/extension allowlist
  - size caps by role/file type.

### Service changes
- `CourseFileSecurityService`:
  - server-side MIME/signature validation
  - quarantine-first upload state
  - AV/CDR scan gate before publish flag
  - normalized safe filename generation.

### Storage/headers
- Serve files from isolated domain/bucket.
- Force download headers:
  - `Content-Disposition: attachment`
  - `X-Content-Type-Options: nosniff`.

### Logging
- Event `security.file.upload` with verdict (`accepted`, `quarantined`, `rejected`).

### Tests
- disguised file rejected/quarantined
- oversized file rejected
- non-scanned file never publicly served

---

## F) Abuse-prone write endpoints (e.g., `feedbacks`, `messages`)

### Rate limiter profiles
- Define dedicated limiters in `RouteServiceProvider` (or dedicated provider):
  - `feedback-write`
  - `message-write`
  - `report-read`
  - `stage-write`

### Middleware wiring
- Attach route-specific throttles (not global only).
- Include actor+IP keying strategy.

### Anti-automation controls
- Add challenge/captcha for anonymous public write routes.
- Introduce temporary lockouts for abnormal burst behavior.

### Tests
- burst requests receive `429`
- limiter resets correctly after window
- trusted internal roles keep sane thresholds without breaking UX

---

## 3) Centralized Security Logging Specification

Implement a dedicated `security` log channel and event helper.

## Required fields

- `event_name`
- `timestamp`
- `request_id`
- `actor_id`
- `actor_role`
- `ip`
- `user_agent`
- `route`
- `method`
- `target_type`
- `target_id`
- `decision` (`allow`/`deny`)
- `reason`

## Operational notes

- Never log secrets/tokens or full PII payloads.
- Use stable event names for SIEM correlation.
- Forward to monitoring stack for alerts and dashboards.

---

## 4) Suggested File/Layer Targets (Laravel)

Use your existing naming conventions; below is a reference target map:

- `app/Policies/StagePolicy.php`
- `app/Policies/StudentPolicy.php`
- `app/Http/Controllers/...` (thin methods with authorize calls)
- `app/Http/Requests/UpdateStageRequest.php`
- `app/Http/Requests/TimetableRequest.php`
- `app/Http/Requests/StoreCourseFileRequest.php`
- `app/Services/Security/StageAccessService.php`
- `app/Services/Security/StudentReportService.php`
- `app/Services/Security/TimetableAccessService.php`
- `app/Services/Security/CourseFileSecurityService.php`
- `app/Support/Security/SecurityAudit.php` (event logger helper)
- `app/Providers/RouteServiceProvider.php` (rate limiters)
- `tests/Feature/Security/*` (authorization + throttling + upload hardening tests)

---

## 5) CI Security Gates

Add mandatory CI checks for:

1. Feature tests tagged `security` must pass.
2. Any new `/{id}` endpoint requires:
   - policy coverage test,
   - deny test for out-of-scope actor.
3. Any new file upload route requires:
   - validation test,
   - quarantine/scan path test.
4. Any new public write route requires route-specific throttle test.

---

## 6) Execution Plan (30/60/90)

## 0-30 Days
- Patch all critical object authorization gaps (stages, reports, timetable scope).
- Add security log events and baseline alerts.
- Apply route-level throttling for abuse-prone endpoints.

## 31-60 Days
- Deploy upload quarantine + scanning pipeline.
- Expand feature security test suite and CI gating.
- Add anomaly dashboards for sequential object access and bulk report reads.

## 61-90 Days
- Implement step-up auth for sensitive exports/actions.
- Add workflow integrity controls for high-risk state transitions.
- Run recurring purple-team validation and tabletop incident drills.

---

## 7) Definition of Done (Per Endpoint)

Endpoint is considered secure only when all are true:

- Validation present via `FormRequest`
- Policy authorization enforced
- Service-level scope guard implemented
- Structured security events emitted for allow/deny
- Route-specific throttling active
- Positive and negative feature tests passing

---

## Final Priority

Patch authorization first (`stages`, `students/{id}/report`, `timetable-data`).  
Then harden uploads and anti-abuse controls.  
Treat object-level authorization regressions as release blockers.

