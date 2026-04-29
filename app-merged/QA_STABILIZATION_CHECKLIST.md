# QA Stabilization Checklist

Date: 2026-04-21
Scope: Production hardening pass (no feature additions)

## Automated verification (executed)

- [x] Backend test suite passed (`composer test`)
  - Result: 35 passed, 0 failed
  - Coverage highlights: auth, role isolation, timetable, attendance, course files, dashboard
- [x] Frontend lint executed (`npm run lint`)
  - Result: 0 errors, 0 warnings
- [x] Frontend production build passed (`npm run build`)
  - Result: success
  - Note: bundle size warning (non-blocking), app builds correctly

## Stability checks completed in code review/refactor

- [x] Unified error parsing with shared helper (`getApiErrorMessage`)
- [x] Render-side toast anti-pattern removed from async pages
- [x] Null-safe fallbacks added to high-risk UI rendering paths
- [x] Empty-state rendering added where lists could be blank
- [x] Backend stage validation moved to FormRequest classes

## Manual UI checks (remaining)

These require interactive browser validation with real role sessions. They are prepared but not auto-executable from CLI.

- [ ] Login/logout/session rehydration per role (`admin`, `teacher/formateur`, `student/stagiaire`, `parent`)
- [ ] Timetable create/update/delete flows with UI feedback and disable states
- [ ] Attendance roll-call submit flow and 403 access-restriction behavior
- [ ] Parent pages (`children`, `child detail`) for data + empty + error states
- [ ] Course files upload/download/delete interactions and edge errors
- [ ] Dashboard role-specific widgets and fallback errors
- [ ] Responsive pass (mobile/tablet/desktop) on core pages
- [ ] Browser console pass (no runtime errors during navigation)

## Release recommendation

- Backend/API stability: READY (based on passing tests)
- Frontend compile quality: READY (lint/build pass)
- Manual UX validation: PENDING (checkboxes above)

Go/No-Go: **No-Go until manual UI checklist is completed**.
