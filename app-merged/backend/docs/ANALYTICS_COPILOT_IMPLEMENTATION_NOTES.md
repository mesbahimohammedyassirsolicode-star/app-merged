# Analytics Copilot Implementation Notes

## New Backend Endpoints

- `POST /api/v1/analytics/copilot/query`
- `POST /api/v1/analytics/query`
- `GET /api/v1/analytics/catalog`

Legacy compatibility remains:

- `POST /api/v1/ai/assistant`
- `POST /api/v1/ai/export`
- `GET /api/v1/analytics/overview`

## New Backend Modules

- `App\Analytics\AnalyticsOrchestrator`
- `App\Analytics\Security\AnalyticsScopeResolver`
- `App\Analytics\Intent\AnalyticsIntentClassifier`
- `App\Analytics\Conversation\AnalyticsConversationService`
- `App\Analytics\Query\AnalyticsPlanBuilder`
- `App\Analytics\Query\AnalyticsStructuredQueryService`
- `App\Analytics\Visualization\AnalyticsChartService`

## New Database Tables

- `analytics_conversations`
- `analytics_messages`
- `analytics_daily_student_metrics`
- `analytics_daily_group_metrics`
- `analytics_monthly_student_risk`

## Current Frontend Experience

The AI Assistant page is now a workspace with:

- conversational copilot panel
- analytics builder panel
- session context panel
- export actions
- follow-up suggestions

## Current Refactor State

Implemented now:

- conversation-aware analytics orchestration
- centralized role scope resolution
- structured metric catalog and query entrypoint
- upgraded copilot response contract
- frontend workspace tied to new APIs
- batched risk aggregation instead of row-by-row grade and attendance lookup

Next recommended implementation steps:

1. Add queue jobs to populate the aggregate analytics tables.
2. Move high-traffic dashboard endpoints to read from aggregate tables.
3. Add anomaly and forecast jobs with persisted outputs.
4. Add saved conversations, saved views, and scheduled reports.
5. Add feature tests for new analytics endpoints and role-scope boundaries.
