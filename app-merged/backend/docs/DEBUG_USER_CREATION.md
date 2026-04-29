# Mandatory step-by-step debug: User creation (teacher/admin) failure

Follow steps **in order**. Do not skip. Each step proves one thing.

---

## STEP 1 – PROVE REQUEST ARRIVAL

**Goal:** Confirm the HTTP request reaches the Laravel backend and the `store()` method runs.

**Code to add:** At the **very first line** inside `UserController::store()` (before any other logic):

```php
public function store(Request $request)
{
    dd('CONTROLLER STORE REACHED', [
        'role' => $request->input('role'),
        'email' => $request->input('email'),
    ]);
    // ... rest of method
```

**How to verify:**

1. From the React app: try to create a **teacher** or **admin**.
2. **If you see a white page with:**  
   `"CONTROLLER STORE REACHED"` and the array with role/email  
   → The request **reaches** the backend and this controller method **is** executed. Go to STEP 5 (and then STEP 6).
3. **If you see:**  
   - No white page, or  
   - A normal JSON response (e.g. success or validation errors), or  
   - Network tab shows a response that is **not** that dump  
   → The request either does **not** hit this method or is handled elsewhere. Continue to STEP 2.

**Remove this `dd()` after the check** so it does not block the next steps.

---

## STEP 2 – PROVE ROUTE IS HIT

**Goal:** Confirm the request is handled by the route you think (e.g. `POST /api/v1/users`), not another route or a 404/redirect.

**Code:** In `routes/api.php`, **temporarily** replace the users resource with a closure. Comment out the resource and add this **inside** the same middleware group (so it stays under `auth:sanctum` and `role:directeur,secretariat,admin`):

```php
// Route::apiResource('users', UserController::class);
Route::post('users', function () {
    dd('ROUTE HIT');
});
```

**Full context** (so you paste in the right place):

```php
Route::middleware('role:directeur,secretariat,admin')->group(function () {
    // Route::apiResource('users', UserController::class);  // COMMENTED FOR DEBUG
    Route::post('users', function () {
        dd('ROUTE HIT');
    });
    Route::get('/feedbacks', [FeedbackController::class, 'index']);
    // ...
});
```

**How to verify:**

1. From React, try again to create a teacher or admin.
2. **If you see** a white page with only `"ROUTE HIT"`:  
   → The route **is** hit. The problem is **not** the route definition. Restore `Route::apiResource('users', UserController::class)` and focus on middleware (403), validation, or DB (Steps 4–6).
3. **If you do NOT see** `"ROUTE HIT"`:  
   → The request is **not** reaching this route. Possible causes:
   - Wrong URL (e.g. `/users` vs `/api/v1/users`). → Do STEP 3.
   - 401/403 before the route (middleware). Check Network tab: status code and response body.
   - Another route catching the request first.

**After the check,** restore the original line:

```php
Route::apiResource('users', UserController::class);
```

---

## STEP 3 – VERIFY REAL ENDPOINT USED BY REACT

**Goal:** Know the **exact** URL and method the frontend uses. A mismatch (`/users` vs `/api/users` vs `/api/v1/users` vs `/register`) can cause “silent” failure (e.g. 404 or wrong handler).

**Option A – Log in the browser (one-off check):**

In `frontend/src/services/userService.ts`, in the `create` function, log the full URL before the request:

```ts
create: async (payload: CreateUserPayload) => {
    const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api') + '/v1';
    const url = `${baseURL}/users`;
    console.log('[DEBUG] POST user create URL:', url);
    const res = await api.post<{ message?: string; data?: User }>('/users', payload);
    return (res.data as any)?.data ?? res.data;
},
```

Then open DevTools → Console, trigger “Create user” (teacher/admin). You should see something like:

`[DEBUG] POST user create URL: http://localhost:8000/api/v1/users`

**Option B – Log in axios (all requests):**

In `frontend/src/lib/axios.ts`, in the request interceptor:

```ts
api.interceptors.request.use((config) => {
    console.log('[DEBUG] Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    const token = localStorage.getItem('token');
    // ...
});
```

**What to check:**

- Expected for this project: **POST** `http://localhost:8000/api/v1/users`  
  (Laravel’s default `api` prefix is `/api`; your routes use `prefix('v1')`, so full path is `/api/v1/users`.)
- If you see `/users` only → missing `/api` or `/api/v1` → 404 or wrong app.
- If you see `/api/users` (no `v1`) → Laravel might have no route for that → 404.
- If you see `/register` or anything else → wrong endpoint → fix the service to use the same baseURL + `/users` as above.

---

## STEP 4 – VERIFY CONTROLLER USED BY ROUTE

**Goal:** Confirm that `POST /api/v1/users` is actually handled by `UserController::store`, not another controller’s `store()`.

**4.1 List routes:**

```bash
cd PFE/backend
php artisan route:list --path=users
```

Look for the line for **POST** `api/v1/users`. The last column should show something like:

`App\Http\Controllers\UserController@store`

If it shows another controller (e.g. `AuthController@register`, or another `...Controller@store`), then that controller is the one really executed.

**4.2 Prove it in code:**

Put a unique `dd()` at the very top of **only** `UserController::store()`:

```php
dd('UserController::store');
```

Trigger create user from React. If you see that string, this controller is the one used. If you never see it but the request returns 200/201 or 422, another controller (or closure) is handling the request.

---

## STEP 5 – VERIFY DATABASE CONSTRAINTS

**Goal:** Ensure `users.role` is an ENUM that allows `admin` and `formateur` (teacher). If the enum only had `student`, inserts for teacher/admin would fail at DB level.

**SQL to inspect column type and allowed values (MySQL):**

```sql
SELECT COLUMN_NAME, COLUMN_TYPE, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'role';
```

For SQLite:

```bash
cd PFE/backend
php artisan tinker
```

Then:

```php
DB::select("PRAGMA table_info(users)");
// find the 'role' row and check type
exit
```

**Expected:** Enum (or string) that includes at least `admin`, `formateur`, `stagiaire`, `parent`.  
Your migration has: `enum('role', ['admin', 'formateur', 'stagiaire', 'parent'])`.  
So the app stores **formateur** for teachers (not the word "teacher"). If the enum did not include `formateur` or `admin`, the insert would throw and you’d get a 500 (or caught exception). If you get a 500 on teacher/admin create, run the SQL above and confirm the enum matches.

---

## STEP 6 – FIX VALIDATION (only after 1–5)

**Rule:** `filiere_id` and `groupe_id` must be **required only for student**. For admin and teacher they must **not** be required and should be ignored (or prohibited) so they cannot block creation.

Apply the **corrected `store()` method** (see separate section below) which:

- Requires `filiere_id` and `groupe_id` only when `role` is student.
- Allows admin and teacher without `filiere_id` / `groupe_id`.
- Keeps all other validation and creation logic (User + Stagiaire/Formateur/Administrator) as already implemented.

---

## STEP 6 – Final corrected store() (apply ONLY after steps 1–5)

Use this version once you have confirmed: request reaches the controller (Step 1), route is hit (Step 2), URL is correct (Step 3), this controller is the one used (Step 4), and DB enum allows admin/formateur (Step 5).

**Validation rules applied:**

- **Base (all roles):** `name`, `email`, `password`, `role` (in: admin, teacher, student).
- **Teacher only:** `matricule`, `specialite` (or `specialty` merged into `specialite`).
- **Student only:** `cin`, `cef_number`, `date_naissance`, `niveau_scolaire`, `niveau_formation`, **`filiere_id`**, **`groupe_id`**, `status`.
- **Admin only:** `poste`, `phone` (optional).

So: **filiere_id and groupe_id are required only when role is student.** They are not added to `$rules` for admin or teacher, so they cannot block creation.

**Exact code:** Remove the STEP 1 `dd()` from `UserController::store()`. The rest of the method can stay as-is; the logic already satisfies the above. If you had added a temporary route closure in Step 2, ensure the route is restored to:

```php
Route::apiResource('users', UserController::class);
```

**Optional hardening:** To avoid any chance of stray `filiere_id`/`groupe_id` from the form affecting non-students, you can ignore them before validation for non-student:

```php
// After $request->merge([...]) and before building $rules:
if ($normalizedRole !== 'student') {
    $request->replace(array_merge($request->except(['filiere_id', 'groupe_id']), [
        'filiere_id' => null,
        'groupe_id' => null,
    ]));
}
```

Then your existing `$rules` (where filiere_id/groupe_id are only set when `$normalizedRole === 'student'`) remain the single source of truth.

---

## Summary

| Step | Proves | If it fails |
|------|--------|-------------|
| 1    | Request reaches `UserController::store()` | Request not reaching this method → 2, 3, 4 |
| 2    | Route `POST .../users` is hit             | Wrong URL or middleware → 3, Network tab |
| 3    | Exact URL used by React                   | Fix baseURL/path in frontend              |
| 4    | Which controller handles the route       | Fix route or remove duplicate route      |
| 5    | DB allows admin/formateur in `users.role` | Fix migration/enum                       |
| 6    | Validation allows teacher/admin          | Use corrected `store()` below            |

After each step, **remove or revert** temporary `dd()` and route overrides so the next step is clean.
