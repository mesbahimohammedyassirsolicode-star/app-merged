# AI Copilot Orchestration V1

## 1) Copilot domain structure

`features/copilot/` is split by deterministic responsibilities:

- `contracts/`: Typed orchestration contracts (`CopilotIntent`, `CopilotResponse`, insight and recommendation records).
- `intents/`: Rule-based first-pass parser and resolver for intent + filters + time range.
- `orchestrator/`: Main orchestration flow that routes intent, reuses analytics cache, and composes responses.
- `context/`: Lightweight memory state and reducer for follow-up prompts.
- `transforms/`: Deterministic insight and recommendation composition from existing analytics payloads.
- `prompts/`: Summary template strategy (deterministic string templates now, LLM-ready abstraction later).
- `hooks/`: React Query compatible hook that orchestrates execution + stores local session memory.
- `widgets/`: Isolated UI panel rendering suggestions, state, insights, recommendations, and safety metadata.

## 2) Intent resolution system

Implemented in `resolveCopilotIntent` as deterministic regex/rule parsing:

- Intent families: `students_at_risk`, `attendance_trend`, `compare_periods`, `top_students`, `weakest_modules`, `overview`.
- Filter extraction:
  - `module_id` via `module <id>`
  - `group_id` via `group <id>`
  - module code capture (example `DEV101`) tracked as unresolved when not mapped to contract filter.
- Time range extraction:
  - `this month`, `last month`, `this year`, compare phrases.
  - Converted to deterministic `date_from` / `date_to`.
- Follow-up memory usage:
  - `"only DEV101"` reuses previous structured filters when possible.

No probabilistic “AI magic” exists in this parser path.

## 3) Copilot response contracts

Implemented typed response shape:

- `title`
- `summary`
- `insights: CopilotInsightRecord[]`
- `recommendations: CopilotRecommendationRecord[]`
- `charts?: CopilotChartSuggestion[]`
- `metadata` including trace, cache reuse info, guardrails, unresolved filters.

Why structured responses matter:

- Deterministic explainability: each section is built from known analytics contracts.
- UI safety: rendering is stable and isolated by strict typed fields.
- Future LLM compatibility: LLM can summarize these structured records without generating raw metrics.

## 4) Analytics orchestrator

Implemented in `orchestrateCopilotResponse`:

1. Resolve intent deterministically.
2. Resolve filters/time range.
3. Reuse React Query cache via existing `queryKeys.analytics.overview`.
4. Fetch overview only when cache miss occurs.
5. Compose insights via transform layer.
6. Compose recommendations via transform layer.
7. Compose summary and chart suggestions.
8. Emit safety metadata + trace.

Hard constraints:

- No direct database logic in frontend copilot layer.
- No duplicated core calculations (uses existing `analytics overview` payload).
- No bypass of existing analytics domains.

## 5) Response composer strategy

- Summary generation: deterministic templates (`summaryTemplates.ts`) by intent family.
- Insight grouping: intent-specific transform functions over `overview`.
- Recommendation prioritization: rule-based priority mapping and hard safety fallback for unsupported intents.
- Chart suggestions: derived from existing chart-ready overview payload.

## 6) Context memory

Implemented lightweight, frontend-safe memory:

- `INITIAL_COPILOT_MEMORY`
- `updateCopilotMemory(previous, intent)`

Stores:

- last intent
- last filters
- last module code
- last time-range preset

This enables deterministic follow-up continuity without LLM memory.

## 7) Copilot widget

`CopilotPanel` provides:

- isolated widget architecture with local state and boundary
- prompt suggestions
- loading/error states
- insight cards
- recommendation cards
- chart suggestion section
- safety trace panel
- mobile-safe stacked layout (`grid` collapses naturally)

Compatible with existing React Query and error boundaries.

## 8) Cache strategy

Current strategy:

- Query reuse: `queryClient.getQueryData(queryKeys.analytics.overview(scope, filters))`
- Synchronization: fetch through the same existing query key + API contract.
- Stale handling: inherits analytics stale time (5 min) to stay aligned with dashboard behavior.
- Invalidation: rely on existing analytics invalidation behavior; copilot never creates independent analytics state.

## 9) AI-safe architecture rules

Guardrails enforced in code:

- No raw uncontrolled queries.
- No metric hallucinations (all metrics from analytics overview payload).
- No duplicated business logic calculations.
- Unsupported intents emit explicit contract gap messages (not fabricated results).
- Metadata trace captures source (`rule`), cache usage, unresolved filters, and guardrail list.

## 10) Phased implementation plan

Rollout plan:

1. **Phase A (current MVP)**: deterministic orchestrator over analytics overview contract.
2. **Phase B**: add module-level analytics contract to fully support `weakest_modules` + better `top_students`.
3. **Phase C**: expand intent grammar + filter dictionary from backend catalog metadata.
4. **Phase D**: optional LLM summarization adapter consumes structured response only (read-only summary layer).
5. **Phase E**: websocket/realtime readiness by subscribing to analytics invalidation events and refreshing shared keys.

Rollback strategy:

- Route can be pointed back to legacy `AiAssistant` component with one import swap.
- New logic is isolated in `features/copilot` and does not alter existing analytics domains.
