# GIMS Dashboard API

**Endpoint:** `GET /api/v1/dashboard`  
**Auth:** `Bearer` token (auth:sanctum)  
**Behavior:** Backend returns role-specific payload. No role middleware on the route; the controller branches on `$request->user()->role`.

---

## Response shape (all roles)

```json
{
  "role": "admin",
  "data": { ... }
}
```

`role` is one of: `admin`, `formateur`, `stagiaire`, `parent`.

---

## Admin — example response

```json
{
  "role": "admin",
  "data": {
    "stats": {
      "total_students": 120,
      "total_teachers": 15,
      "total_filieres": 8,
      "total_groupes": 24
    },
    "charts": {
      "students_per_filiere": [
        { "name": "TSGE", "value": 25 },
        { "name": "TGI", "value": 30 }
      ]
    },
    "quick_actions": [
      { "label": "Gérer les utilisateurs", "path": "/users" },
      { "label": "Filières et groupes", "path": "/academic/filieres" },
      { "label": "Groupes", "path": "/groups" }
    ]
  }
}
```

---

## Formateur (teacher) — example response

```json
{
  "role": "formateur",
  "data": {
    "todays_sessions": [
      {
        "id": 1,
        "module": "Développement Web",
        "groupe": "TSGE-1A",
        "filiere": "TSGE",
        "start_time": "08:00:00",
        "end_time": "10:00:00"
      }
    ],
    "assigned_modules": [
      {
        "affectation_id": 5,
        "module_code": "DW",
        "module_label": "Développement Web",
        "groupe_label": "TSGE-1A"
      }
    ],
    "quick_actions": [
      { "label": "Marquer les présences", "path": "/attendance" },
      { "label": "Saisir les notes", "path": "/evaluations" }
    ]
  }
}
```

---

## Stagiaire (student) — example response

**Data isolation:** `filiere` and `groupe` come only from the stagiaire's assigned filière/groupe. `syllabus_progress` lists affectations for the student's groupe(s) where the module belongs to the student's filière. `latest_grades` only includes notes for evaluations in that filière. No global module or group lists.

```json
{
  "role": "stagiaire",
  "data": {
    "filiere": { "id": 1, "code": "TSGE", "label": "Technicien en développement" },
    "groupe": { "id": 3, "label": "TSGE-1A" },
    "syllabus_progress": [
      { "module": "Développement Web", "progress_percent": 65.5, "completed_count": 15, "total_count": 23 }
    ],
    "latest_grades": [
      { "evaluation": "CC1", "module": "DW", "value": 14.5, "date": "2025-02-10" }
    ],
    "quick_actions": [
      { "label": "Emploi du temps", "path": "/timetable" },
      { "label": "Ma progression", "path": "/progress" }
    ]
  }
}
```

---

## Parent — example response

```json
{
  "role": "parent",
  "data": {
    "children": [
      {
        "id": 10,
        "name": "Fatima Alaoui",
        "filiere": "TSGE",
        "groupe": "TSGE-1A",
        "attendance_percent": 85.5,
        "is_risk": false,
        "latest_grades": [
          { "evaluation": "CC1", "module": "DW", "value": 12 }
        ]
      }
    ],
    "alerts": [],
    "quick_actions": [
      { "label": "Voir les enfants", "path": "/parent/children" }
    ]
  }
}
```

When a child has `attendance_percent` < 80%, they also appear in `alerts` (same shape as one entry in `children`).
