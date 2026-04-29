# GIMS API v1

**Base URL:** `/api/v1`  
**Rate limit:** Login 5 req/min per IP; authenticated 60 req/min per user.  
**Response format:** `{ "data": ..., "meta": ... }` or `{ "message": "...", "errors": [...] }` (422).  
**Health:** `GET /api/v1/health` (no auth) → `{ data: { status, checks } }`.

## Authentication

- **Login:** `POST /api/v1/login`  
  Body: `{ "email": "...", "password": "..." }`  
  Response: `{ "data": { "access_token", "token_type": "Bearer", "user", "roles", "permissions" } }`
- **Logout:** `POST /api/v1/logout` — Header: `Authorization: Bearer <token>`
- **Me:** `GET /api/v1/me` — Response: `{ "data": { "user", "roles", "permissions" } }`

## Authorization

- **Directeur / Secrétariat:** users, feedbacks list, academic structure (years, filières), groups CRUD, modules CRUD, affectations CRUD, stages CRUD.
- **Formateur:** groups read, modules + syllabus, affectations read, seances, roll-call, evaluations, notes, stages CRUD.
- **Stagiaire:** (read own data — to be refined in Phase 3).
- **Parent:** read-only `/api/v1/parent/children`, `/api/v1/parent/children/{id}/grades`, `/api/v1/parent/children/{id}/attendance`.

## Endpoints (summary)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /login | Public login |
| POST | /feedbacks | Public anonymous feedback (optional submission_token) |
| GET  | /academic-structure/years | List years (admin) |
| POST | /academic-structure/years | Create year (admin) |
| GET  | /academic-structure/levels, /niveaux | List levels |
| GET  | /academic-structure/filieres | List filières (admin) |
| GET  | /groups | List groups (paginated) |
| GET  | /groups/{group} | Show group |
| POST | /groups/{group}/enroll | Enroll stagiaires (admin) |
| GET  | /modules | List modules |
| GET  | /modules/{module}/syllabus | Get/update syllabus |
| GET  | /affectations | List affectations |
| GET  | /seances | List seances (paginated) |
| GET  | /seances/{seance}/roll-call | Get roll call (attendances) |
| POST | /seances/{seance}/roll-call | Submit roll call (attendances) |
| GET  | /evaluations | List evaluations (paginated) |
| GET  | /evaluations/{evaluation}/notes | Get notes view |
| POST | /evaluations/{evaluation}/notes | Save notes (audit logged) |
| GET  | /stages | List stages (paginated) |
| GET  | /notifications | User notifications (paginated) |
| GET  | /parent/children | Parent: list children |
| GET  | /parent/children/{id}/grades | Parent: child grades |
| GET  | /parent/children/{id}/attendance | Parent: child attendance summary |

**Pagination:** `?page=1&per_page=20` (max 50). Response includes `meta`: `current_page`, `last_page`, `per_page`, `total`.

**Errors:** 401 Unauthorized, 403 Forbidden, 422 Validation (body: `errors`).
