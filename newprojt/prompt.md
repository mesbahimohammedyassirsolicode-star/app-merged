You are a Senior Full Stack Engineer and QA Fix Specialist.

Your mission is to analyze and FIX all issues detected in the QA audit of the EduFlow School Management System.

Stack:
- Frontend: React.js + Vite + TailwindCSS
- Backend: Laravel API
- Database: MySQL
- Auth: Sanctum
- Routing: React Router
- HTTP Client: Axios

IMPORTANT:
- Apply fixes directly in code
- Refactor bad practices when necessary
- Keep existing UI design
- Preserve dark theme
- Keep responsive behavior
- Add clean and scalable architecture
- Do NOT break existing working features
- Add comments for important fixes

====================================================
CRITICAL QA ISSUES TO FIX
====================================================

# 1. GLOBAL API ERROR HANDLING

Problem:
- API failures (422 / 500 / network errors) fail silently
- No feedback shown to user

Fix:
- Create global Axios response interceptor
- Show toast notifications for:
  - validation errors
  - server errors
  - unauthorized errors
  - network failures
- Use react-hot-toast or equivalent
- Display readable backend messages
- Prevent silent failures everywhere

Expected behavior:
- Every failed request must show clear feedback

====================================================

# 2. FORM VALIDATION ERRORS (STUDENTS & TEACHERS)

Problem:
- Create/Edit forms return 422 errors
- Validation messages are not displayed
- Save operations fail silently

Fix frontend:
- Catch Laravel validation errors
- Map error.response.data.errors to form fields
- Display inline error messages under each input
- Highlight invalid fields
- Prevent submit if invalid

Fix backend:
- Verify StoreStudentRequest
- Verify UpdateStudentRequest
- Verify Teacher validation requests
- Ensure frontend payload keys match backend expected fields
- Fix naming mismatches:
  Example:
    frontend => firstName
    backend => prenom

Expected behavior:
- Forms save correctly
- Validation errors appear instantly
- User understands what failed

====================================================

# 3. STUDENT FILTERS NOT WORKING

Problem:
- Filter by niveau fails
- Filter by statut fails

Fix:
- Normalize IDs before comparisons
- Fix query params
- Ensure frontend filtering logic uses correct data types
- Verify backend filters receive:
  - niveau_id
  - statut

Expected behavior:
- Filters instantly update results correctly

====================================================

# 4. ABSENCE FILTERS NOT WORKING

Problem:
- Status/date/class filters inconsistent

Fix:
- Correct filtering logic
- Ensure useMemo/useEffect dependencies are correct
- Fix API params
- Verify status comparison logic

Expected behavior:
- All filters work correctly

====================================================

# 5. DASHBOARD QUICK ACTIONS

Problem:
- Quick action buttons inactive

Fix:
- Add proper navigation using React Router
- Use Link or navigate()
- Ensure all actions redirect correctly

Examples:
- Ajouter élève
- Ajouter enseignant
- Paiements
- Absences

====================================================

# 6. CLASSES & NIVEAUX RENDERING

Problem:
- Lists appear empty
- Text not rendering

Fix:
- Inspect API response schema
- Correct wrong property names
- Replace incorrect keys:
  item.name -> item.nom
- Add fallback rendering

Expected behavior:
- All labels/counts display correctly

====================================================

# 7. CRUD OPERATIONS

Problem:
- Edit/Delete unstable
- UI not refreshing after actions

Fix:
- Add optimistic UI updates
- Refresh lists after create/update/delete
- Add confirmation modal before delete
- Handle API failures safely

Expected behavior:
- CRUD fully operational everywhere

====================================================

# 8. LOADING STATES

Problem:
- No loading feedback during requests

Fix:
- Add reusable Loader component
- Add skeletons/spinners
- Disable buttons while loading

Expected behavior:
- Smooth UX during async operations

====================================================

# 9. EMPTY STATES

Fix:
- Add friendly empty state components

Examples:
- Aucun élève trouvé
- Aucun paiement disponible
- Aucune absence enregistrée

====================================================

# 10. MOCK DATA REPLACEMENT

Problem:
- Some modules still use local/mock state

Modules:
- Notes
- Transport
- Emploi du temps

Fix:
- Replace mock data with real API integration
- Add database persistence
- Create missing endpoints if needed

====================================================

# 11. CODE QUALITY IMPROVEMENTS

Refactor architecture:

Frontend:
- services/
- hooks/
- reusable components/
- api/
- utils/

Backend:
- Services layer
- API Resources
- Form Requests
- Proper validation
- Clean controllers

====================================================

# 12. SECURITY & STABILITY

Add:
- Proper try/catch everywhere
- Protected routes
- Unauthorized handling
- Token expiration handling
- Safe null checking
- Defensive rendering

====================================================

# 13. PERFORMANCE IMPROVEMENTS

Optimize:
- unnecessary re-renders
- heavy useEffect calls
- repeated API calls
- large table rendering

Add:
- memoization
- pagination optimization
- lazy loading where useful

====================================================

# 14. FINAL QA VERIFICATION

After fixing:
- Retest all modules
- Ensure no console errors
- Ensure no blank pages
- Ensure no unhandled promise rejections
- Ensure mobile responsiveness still works
- Ensure dark mode consistency

====================================================

EXPECTED OUTPUT
====================================================

For every fix:
1. Explain root cause
2. Show modified files
3. Show before/after code
4. Apply scalable solution
5. Keep code clean and production-ready

Goal:
Transform EduFlow into a stable production-grade SaaS school management platform with professional UX and robust backend/frontend communication.