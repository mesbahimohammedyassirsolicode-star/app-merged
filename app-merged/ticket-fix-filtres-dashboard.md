# Fix the Dashboard analytics filters dependency issue

**Current issue:**
- In Analytics Dashboard, when selecting a Filière, all Groups are still displayed.
- Expected behavior:
  1. User selects a Filière.
  2. Groups dropdown refreshes automatically.
  3. Only groups belonging to the selected Filière appear.
  4. If no Filière selected → disable Groups filter or show "Select Filière first".
  5. Reset selected Group when Filière changes.
  6. Analytics cards/charts/tables must refresh using selected Filière + Group.

**Backend:**
- Filter groups using relation:
  `groups.filiere_id = selected_filiere_id`

API example:
`GET /groups?filiere_id={id}`

**Frontend:**
- Watch selectedFiliere state.
- Trigger fetchGroups(selectedFiliere).
- Clear previous groups state before loading.
- Add loading skeleton for dropdown.

**Pseudo logic:**

```
onFiliereChange(id):
   selectedGroup = null
   groups = []
   fetchGroups(id)

fetchGroups(filiereId):
   return groups.filter(
      g => g.filiere_id === filiereId
   )
```

**UI improvements:**
- Show only relevant groups
- Empty state if no groups found
- Smooth dropdown transition
- Prevent showing stale cached data
- Add console logs for debugging

**Validation:**
- [x] Filière A → only its groups
- [x] Filière B → only its groups
- [x] Change Filière → Group resets
- [x] Dashboard charts update correctly
