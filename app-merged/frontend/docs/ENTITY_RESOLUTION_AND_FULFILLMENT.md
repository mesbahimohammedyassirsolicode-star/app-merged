# Entity resolution and full intent fulfillment

## 1) Entity domain architecture (`features/copilot/entities/`)

| Path | Responsibility |
|------|----------------|
| `contracts/` | `ResolvedEntity`, ambiguity/unresolved payloads, registry row shapes, clarification contracts, trace entries. |
| `resolvers/` | Deterministic `resolveModuleEntity`, `resolveGroupEntity`, `resolveStudentEntity`, `resolveTeacherEntity`, plus `resolveEntitiesForCopilotIntent` coordination. |
| `cache/` | `loadEntityRegistries` — React Query `fetchQuery` for modules, groups, students, teachers with shared query keys. |
| `hooks/` | `usePrefetchEntityRegistries` — optional warm-up for autocomplete / realtime invalidation later. |
| `transforms/` | `toAuditTrace` — serialize traces for logs / compliance. |
| `utils/` | Normalization, deterministic alias expansion (config map only), scoring tiers (exact → normalized → alias/substring). |

## 2) Why explainability metadata matters

- **Trust**: Users and auditors can see *which string* mapped to *which id* and *which rule tier* (`exact` / `normalized` / `alias`).
- **No silent guessing**: Ambiguity returns `clarification` + `executionBlocked` instead of picking a random candidate.
- **Future LLM boundary**: Any summarization layer must consume `CopilotResponse` + `resolved_entities` traces, not invent metrics or ids.

## 3) Entity cache strategy

- Keys live in `lib/query-keys.ts` under `queryKeys.entities.*` and `queryKeys.analytics.structuredQuery`.
- **Reuse**: All resolver corpora and structured queries go through `queryClient.fetchQuery` with stable keys (sorted params).
- **Invalidation**: Invalidate `entities` subtree when admin mutates modules/groups/users; invalidate `analytics` when grades/attendance change (existing app patterns).
- **Autocomplete / realtime**: Same keys can be prefetched on Copilot focus; websocket handlers can `invalidateQueries({ queryKey: queryKeys.entities.all })` later.

## 4) Copilot execution flow (deterministic)

```
User query
  → Intent resolver (rules, time range, entity mentions)
  → loadEntityRegistries (cache-aware)
  → Entity resolvers (per slot; ambiguity stops execution)
  → Merge resolved ids into `AnalyticsFiltersContract`
  → Analytics orchestrator
        • overview: GET /analytics/overview
        • structured: POST /analytics/query (validated metric/dimension/filters)
  → Insight / recommendation transforms (reuse contracts)
  → Structured CopilotResponse + traces
```

**Boundaries**: Intent layer never touches SQL. Entity layer never computes KPIs. Orchestrator only calls existing analytics endpoints.

## 5) Safety guardrails (enforced)

- No entity resolution without a loaded corpus (empty → `unresolved`).
- Ambiguous equal-tier matches → `ambiguous` (no execution).
- Structured analytics limited to catalog metrics/dimensions + validated filters (including `module_id` / `group_id` where implemented).
- Teacher entity resolved for trace only; overview remains role-scoped until backend supports explicit teacher filters.

## 6) Phased rollout

1. **Ship**: Entity resolution + `compare_groups`, `attendance_by_module`, `weakest_modules`, `top_students`, `students_at_risk` fulfillment (current).
2. **Harden**: Role-scoped integration tests; expand `TOKEN_ALIASES` via config, not LLM.
3. **Autocomplete UI**: Drive search from the same `queryKeys.entities` caches.
4. **Realtime**: Invalidate entity + analytics keys on domain events over websockets.
5. **LLM (optional)**: Reword `summary` from structured response only; entity resolution stays rule-based unless a second deterministic retrieval layer is added.

## 7) Rollback

- Feature flag: swap orchestrator pre-step `resolveEntitiesForCopilotIntent` to no-op merge (not recommended) or revert `orchestrateCopilotResponse.ts` + entity folder.
- Backend: `module_id` / `group_id` on structured query are backward compatible (optional filters).
