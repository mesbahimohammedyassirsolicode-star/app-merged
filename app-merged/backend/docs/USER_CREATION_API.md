# GIMS — User Creation API

## Route

| Method | Path | Auth | Roles |
|--------|------|------|-------|
| POST | `/api/v1/users` | Bearer Token (auth:sanctum) | directeur, secretariat, admin |

---

## Example Requests

### 1. Create Teacher (Formateur)

```bash
TOKEN="your_bearer_token_here"

curl -X POST "http://localhost:8000/api/v1/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Ahmed Bennani",
    "email": "ahmed.bennani@gims.ma",
    "password": "Password123",
    "role": "formateur",
    "matricule": "F12345",
    "specialty": "Développement Digital",
    "type": "permanent"
  }'
```

### 2. Create Admin

```bash
curl -X POST "http://localhost:8000/api/v1/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Admin Test",
    "email": "admin2@gims.ma",
    "password": "Password123",
    "role": "admin"
  }'
```

### 3. Create Student (Stagiaire)

```bash
curl -X POST "http://localhost:8000/api/v1/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Fatima Alaoui",
    "email": "fatima.alaoui@gims.ma",
    "password": "Password123",
    "role": "stagiaire",
    "cin": "AB123456",
    "cef_number": "M13001234567",
    "date_naissance": "2000-05-15",
    "niveau_scolaire": "BAC",
    "niveau_formation": "TS",
    "filiere_id": 1,
    "groupe_id": 1
  }'
```

---

## Field Requirements by Role

| Field | admin | teacher/formateur | student/stagiaire |
|-------|-------|-------------------|-------------------|
| name | required | required | required |
| email | required | required | required |
| password | required | required | required |
| role | required | required | required |
| matricule | - | required | - |
| specialty/specialite | - | required | - |
| type | - | required (permanent/vacataire) | - |
| cin | - | - | required |
| cef_number | - | - | required |
| date_naissance | - | - | required |
| niveau_scolaire | - | - | required |
| niveau_formation | - | - | required |
| filiere_id | - | - | required |
| groupe_id | - | - | required |

**Note:** `filiere_id` and `groupe_id` are only required for `stagiaire`.

---

## Success Response (201)

```json
{
  "message": "User created successfully.",
  "data": {
    "id": 5,
    "name": "Ahmed Bennani",
    "email": "ahmed.bennani@gims.ma",
    "role": "formateur",
    "formateur": {
      "matricule": "F12345",
      "specialty": "Développement Digital",
      "type": "permanent"
    }
  }
}
```

---

## Validation Error (422)

```json
{
  "message": "Validation failed.",
  "errors": {
    "matricule": ["Le champ matricule a déjà été pris."],
    "email": ["Le champ email a déjà été pris."]
  }
}
```

---

## Getting the Token

```bash
curl -X POST "http://localhost:8000/api/v1/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@gims.ma","password":"Password123"}'
```

Response includes `token` — use it in `Authorization: Bearer <token>`.
