# Analytics Copilot SaaS Architecture

## 1. Product Goal

Build a production-grade Analytics Copilot for a Laravel + React school management platform that supports:

- secure multi-role analytics
- natural language analytics
- conversational follow-up queries
- predictive and anomaly analytics
- role-scoped recommendations
- scalable chart and dashboard generation
- SaaS-ready observability, caching, and auditability

The current codebase already includes:

- `AiAssistantController`
- `AnalyticsController`
- `AiAssistantService`
- `AnalyticsService`
- `IntentParserService`
- role and object-scope protections

This redesign evolves those capabilities into a modular analytics platform instead of a single assistant endpoint.

---

## 2. Target Architecture

### 2.1 High-Level Layers

Use a layered analytics architecture:

1. Interaction Layer
- React Analytics Copilot UI
- Dashboard widgets
- Saved reports
- Alert center
- Admin analytics studio

2. API Layer
- Copilot chat/query API
- dashboard analytics API
- insights API
- recommendation API
- chart schema API
- exports API

3. Orchestration Layer
- intent classification
- entity extraction
- context resolution
- role-scope enforcement
- analytics plan generation
- response synthesis

4. Analytics Execution Layer
- metrics engine
- query builder engine
- insight engine
- anomaly engine
- trend engine
- predictive engine
- recommendation engine

5. Data Access Layer
- scoped repositories
- analytics SQL builders
- aggregate read models
- cache adapters

6. Data Layer
- MySQL OLTP tables
- analytics aggregate tables
- materialized summary tables
- Redis cache
- queue/jobs storage
- audit logs

### 2.2 Recommended Production Components

- Laravel API as orchestration and secure execution layer
- React frontend for copilot and dashboards
- MySQL 8 as transactional + analytics store for current phase
- Redis for cache, session fragments, prompt/session state, locks, and rate limiting
- Laravel queues for heavy analytics, backfills, forecasting, anomaly scans, and exports
- object storage for generated reports
- optional vector store later for semantic glossary, KPI catalog, and dashboard knowledge

### 2.3 Domain Modules

Create clear backend modules:

- `AnalyticsCore`
- `AnalyticsSecurity`
- `AnalyticsIntent`
- `AnalyticsConversation`
- `AnalyticsQuery`
- `AnalyticsInsights`
- `AnalyticsPrediction`
- `AnalyticsRecommendation`
- `AnalyticsVisualization`
- `AnalyticsMonitoring`

---

## 3. Request Types To Support

The copilot should classify every query into one of these families:

- KPI retrieval
- comparative analysis
- trend analysis
- root-cause exploration
- risk identification
- anomaly investigation
- predictive forecast
- recommendation request
- chart request
- export/report request
- conversational follow-up
- unsupported/out-of-scope request

Examples:

- "Show attendance rate for TSGE1A this month"
- "Why did attendance drop last week?"
- "Which students are likely to fail next term?"
- "Compare module performance across groups"
- "Create a chart for late arrivals by day"
- "Only show my assigned groups"
- "Export the same result as PDF"
- "Now split that by filiere"

---

## 4. Secure Multi-Role Analytics Model

### 4.1 Security Principle

Never let the LLM generate raw SQL that executes directly.

The LLM may only produce:

- intent
- filter hints
- comparison hints
- chart preferences
- explanation language

The server remains the only authority for:

- scope resolution
- metric definitions
- allowed dimensions
- SQL generation
- output suppression rules

### 4.2 Role Scope Matrix

Use a role-aware analytics scope resolver that returns:

- tenant_id
- role
- allowed student ids
- allowed group ids
- allowed module ids
- allowed filiere ids
- allowed academic year ids
- field masking rules
- export permissions
- drilldown permissions

Recommended role behavior:

- `admin`: full tenant analytics
- `directeur`: full academic analytics, no low-level security admin data
- `secretariat`: operational analytics, limited sensitive interventions
- `formateur`: only assigned modules/groups/students
- `parent`: only linked children
- `stagiaire`: only self analytics

### 4.3 Row-Level Security Strategy In App Layer

Because MySQL does not provide PostgreSQL-style RLS, enforce security in Laravel using:

- `AnalyticsScopeResolver`
- `ScopedQueryContext`
- `AnalyticsPolicyGuard`
- scoped repositories

Every analytics query receives a non-optional `ScopedQueryContext`.

### 4.4 Sensitive Data Rules

Define response protection rules:

- student-level personal insights hidden for aggregated low-scope roles
- minimum cohort thresholds for some reports, for example no subgroup smaller than 5
- parent users never see unrelated student benchmarks by identity
- trainer users cannot cross-drill into unassigned groups
- exports inherit same scope and masking

---

## 5. Conversational Memory Architecture

### 5.1 Why Memory Matters

Users will ask follow-ups like:

- "Now compare it to last month"
- "Only for group A"
- "Show a chart"
- "Which students caused the drop?"

### 5.2 Memory Structure

Store a conversation session table:

- `analytics_conversations`
- `analytics_messages`
- `analytics_context_snapshots`

Persist:

- original user query
- normalized intent
- resolved dimensions
- resolved filters
- scope hash
- metric ids
- chart spec
- result summary
- references to cached result keys

### 5.3 Context Rules

Memory should track:

- current subject: attendance, grades, risk
- current grain: student, group, module, month
- current filters
- prior result ids
- unresolved pronouns and follow-up references

Example:

- Q1: "Show attendance for my groups this month"
- memory stores metric=`attendance_rate`, scope=`assigned_groups`, grain=`month`
- Q2: "Now compare with last month"
- parser expands using prior metric and scope

### 5.4 Memory Safety

Invalidate or reset context when:

- user changes role/session
- tenant boundary changes
- follow-up crosses outside authorized scope
- referenced prior result expired or was produced under different filters

---

## 6. Intent Classification System

### 6.1 Recommended Two-Stage Intent System

Stage 1: deterministic classifier
- route obvious requests
- cheap, fast, auditable

Stage 2: LLM structured classifier
- handles ambiguous phrasing
- extracts entities, filters, time ranges, comparison axes, chart needs

### 6.2 Classification Output Contract

Return structured payload like:

```json
{
  "intent_family": "trend_analysis",
  "intent_name": "attendance_trend",
  "confidence": 0.94,
  "entities": {
    "group_name": "TSGE1A",
    "module_name": null,
    "student_name": null
  },
  "time_range": {
    "preset": "this_month",
    "date_from": "2026-05-01",
    "date_to": "2026-05-31"
  },
  "dimensions": ["week"],
  "metrics": ["attendance_rate"],
  "comparison": null,
  "visualization_hint": "line_chart",
  "follow_up": false
}
```

### 6.3 Suggested Intent Families

- `kpi_lookup`
- `distribution_analysis`
- `trend_analysis`
- `comparison_analysis`
- `risk_analysis`
- `anomaly_analysis`
- `prediction_analysis`
- `recommendation_request`
- `chart_generation`
- `report_export`
- `conversation_follow_up`

### 6.4 Fallback Rules

If confidence is low:

- ask disambiguation only when necessary
- otherwise default to safe aggregate analytics
- never guess a sensitive student identity

---

## 7. AI Orchestration Flow

### 7.1 Full Copilot Request Lifecycle

1. receive request
2. validate auth, tenant, role, rate limit
3. create request trace id
4. load conversation memory
5. resolve role scope
6. classify intent
7. normalize filters/entities
8. validate requested dimensions/metrics against allowed catalog
9. build analytics execution plan
10. check cache
11. run analytics engines
12. compute insights/recommendations/charts
13. synthesize natural language answer
14. persist conversation artifacts
15. emit audit + telemetry
16. return structured response

### 7.2 Execution Plan Object

Introduce an internal plan object:

```php
[
  'intent_family' => 'trend_analysis',
  'metric_ids' => ['attendance_rate'],
  'dimensions' => ['week'],
  'filters' => [...],
  'scope' => [...],
  'chart_type' => 'line',
  'engines' => ['metrics', 'trend', 'insight'],
  'cache_ttl' => 300,
]
```

This plan becomes the backbone of observability and reproducibility.

---

## 8. Query Builder System

### 8.1 Design Goal

Replace ad hoc query branching with a metadata-driven analytics query builder.

### 8.2 Metric Catalog

Create a catalog table or config-driven registry:

- metric id
- label
- description
- SQL expression or builder class
- supported grains
- supported dimensions
- supported roles
- freshness SLA
- cache TTL

Examples:

- `attendance_rate`
- `absence_count`
- `late_rate`
- `average_grade`
- `pass_rate`
- `at_risk_count`
- `engagement_score`
- `assignment_completion_rate`

### 8.3 Dimension Catalog

Dimensions should be normalized and whitelisted:

- academic_year
- month
- week
- day
- filiere
- groupe
- module
- formateur
- student
- risk_level
- attendance_status

### 8.4 Query Builder Components

Recommended classes:

- `AnalyticsMetricRegistry`
- `AnalyticsDimensionRegistry`
- `AnalyticsFilterNormalizer`
- `AnalyticsPlanBuilder`
- `AnalyticsQueryBuilder`
- `ScopedAggregateRepository`

### 8.5 Query Builder Rules

- only use whitelisted metrics and dimensions
- all filters are typed and normalized
- all queries receive a role scope constraint
- support aggregate-only and drilldown modes
- support top-N and pagination
- support cohort thresholds for privacy

### 8.6 Example Builder Flow

For: "Compare average grade by module for my groups this semester"

1. classify intent
2. resolve `average_grade` metric
3. resolve dimension `module`
4. resolve scope `assigned_groups`
5. resolve time range `semester`
6. build aggregate SQL
7. compute best/worst module insights
8. return chart schema + explanation

---

## 9. Analytics Engine

### 9.1 Core Engines

Split analytics into dedicated engines:

- `MetricsEngine`
- `TrendEngine`
- `AnomalyEngine`
- `InsightEngine`
- `PredictionEngine`
- `RecommendationEngine`
- `VisualizationEngine`

### 9.2 Metrics Engine

Responsible for:

- KPI calculation
- grouped aggregates
- benchmark calculations
- period-over-period comparisons

### 9.3 Trend Engine

Responsible for:

- moving averages
- period deltas
- growth/decline rates
- rolling 7-day / 30-day trends
- seasonal patterns by week/month

### 9.4 Anomaly Engine

Start with lightweight methods:

- z-score on attendance or grade drops
- rolling baseline deviation
- sudden change thresholds
- missing expected records detection

Later evolve to:

- isolation forest outside Laravel via Python microservice if needed
- multivariate anomaly scoring

### 9.5 Insight Engine

Responsible for:

- summarizing strongest findings
- ranking drivers
- generating factual insight bullets
- mapping metrics to human explanation templates

Insight generation should be hybrid:

- rule-first
- LLM-enhanced wording second

### 9.6 Visualization Engine

Maps output data shape to chart recommendations:

- line for time trends
- bar for ranked comparisons
- stacked bar for status mix
- heatmap for attendance by weekday/hour
- scatter for grade vs attendance correlation
- funnel for intervention pipeline

---

## 10. Risk Scoring Engine

### 10.1 Student Risk Model

Use a transparent weighted scoring model first.

Inputs:

- average grade
- grade trend slope
- attendance rate
- absence streak
- late frequency
- missed assessments
- module difficulty concentration
- engagement recency

### 10.2 Example Formula

```text
Risk Score =
  0.30 * grade_risk +
  0.25 * attendance_risk +
  0.15 * trend_decline_risk +
  0.10 * absence_streak_risk +
  0.10 * missed_evaluation_risk +
  0.10 * engagement_risk
```

Normalize to `0-100`.

### 10.3 Risk Bands

- `0-34`: low
- `35-64`: medium
- `65-100`: high

### 10.4 Risk Outputs

Return:

- risk score
- risk level
- strongest contributing factors
- confidence level
- recommended interventions
- trend direction

### 10.5 Why This Approach First

- easy to explain to school administrators
- easy to tune
- works with limited data
- safer than opaque ML in early production

---

## 11. Predictive Analytics Ideas

### 11.1 Phase 1 Predictive Features

- fail-risk prediction next month/term
- attendance deterioration forecast
- probable dropout watchlist
- module pass-rate forecast
- intervention priority ranking

### 11.2 Phase 2 Predictive Features

- forecast final average by student
- predict group attendance by week
- estimate impact of remedial intervention
- forecast overload periods for trainers

### 11.3 Practical Methods

Start with:

- weighted rules
- regression on attendance/grade trend
- simple time-series smoothing

Later:

- XGBoost or LightGBM in offline scoring service
- calibration layer for probability quality
- model monitoring and drift checks

### 11.4 Prediction Safety

- predictions must be advisory, not punitive
- expose explanation factors
- never claim certainty
- track score version used

---

## 12. Database Optimization Strategy

### 12.1 Current Constraint

You are migrating toward MySQL 8, so optimize for:

- strong indexes
- read-friendly denormalized analytics tables
- queue-driven summary refresh
- cache-first aggregates

### 12.2 Base Table Indexing

Critical indexes:

- `attendances(student_id, date, status)`
- `attendances(group_id, date)`
- `attendances(module_id, date)` if module stored
- `notes(stagiaire_id, evaluation_id, valeur)`
- `evaluations(module_id, groupe_id, date)`
- `stagiaires(user_id, groupe_id, filiere_id)`
- `formateur_module_group(user_id, groupe_id, module_id)`
- `module_groupe(groupe_id, module_id)`

### 12.3 Add Analytics-Friendly Columns

For large scale, keep normalized facts with direct analytics keys:

- `tenant_id`
- `academic_year_id`
- `filiere_id`
- `groupe_id`
- `module_id`
- `student_id`
- `date`
- `week_key`
- `month_key`

This avoids repeated expensive joins.

### 12.4 Summary Tables

Introduce aggregate tables:

- `analytics_daily_student_metrics`
- `analytics_daily_group_metrics`
- `analytics_daily_module_metrics`
- `analytics_monthly_student_risk`
- `analytics_alert_events`

Example columns for daily group metrics:

- tenant_id
- academic_year_id
- date
- group_id
- filiere_id
- attendance_rate
- absence_count
- late_count
- average_grade
- pass_rate
- risk_count_high
- updated_at

### 12.5 Refresh Strategy

Use queue jobs for:

- nightly full metric refresh
- event-driven incremental updates after new attendance/grade writes
- backfill repair jobs

### 12.6 MySQL Query Patterns

Prefer:

- covering indexes
- summary tables for repeated dashboard KPIs
- avoiding unbounded scans
- avoiding N+1 per student risk scoring
- batching with grouped SQL instead of row loops

### 12.7 Materialization Guideline

Materialize when:

- same query pattern is requested often
- same metric powers multiple dashboards
- joins span attendance + notes + evaluations + assignments
- per-request compute exceeds acceptable latency

---

## 13. Caching Strategy

### 13.1 Cache Layers

Use 4 cache layers:

1. metadata cache
- metric catalog
- dimension catalog
- scope maps

2. query result cache
- scoped aggregate results

3. conversation context cache
- recent copilot context

4. insight/render cache
- generated summaries
- chart configs

### 13.2 Cache Key Structure

Key format:

```text
analytics:{tenant}:{role}:{user}:{scopeHash}:{planHash}:{version}
```

### 13.3 TTL Recommendations

- metadata: 1 hour
- dashboard KPIs: 2 to 5 minutes
- copilot results: 2 to 10 minutes
- prediction/risk snapshots: 15 to 60 minutes
- exports: 24 hours stored file reference

### 13.4 Cache Invalidation

Invalidate by domain events:

- attendance recorded
- grade entered
- student assignment changed
- parent-student link changed
- trainer assignment changed

Use tagged caches if available through Redis strategy.

---

## 14. Laravel Backend Structure

### 14.1 Suggested Folder Structure

```text
app/
  Analytics/
    Contracts/
    DTOs/
    Enums/
    Engines/
    Exceptions/
    Jobs/
    Policies/
    Prompts/
    Query/
    Repositories/
    Resources/
    Security/
    Support/
    Visualization/
  Http/
    Controllers/Api/Analytics/
    Requests/Analytics/
```

### 14.2 Recommended Core Classes

- `AnalyticsCopilotController`
- `AnalyticsConversationController`
- `AnalyticsDashboardController`
- `AnalyticsInsightController`
- `AnalyticsRecommendationController`
- `AnalyticsExportController`

Services:

- `AnalyticsCopilotService`
- `AnalyticsOrchestrator`
- `AnalyticsScopeResolver`
- `AnalyticsConversationService`
- `AnalyticsIntentClassifier`
- `AnalyticsEntityResolver`
- `AnalyticsPlanBuilder`
- `AnalyticsQueryExecutor`
- `AnalyticsInsightService`
- `AnalyticsRecommendationService`
- `AnalyticsChartService`
- `AnalyticsRiskService`
- `AnalyticsPredictionService`

Repositories:

- `AttendanceAnalyticsRepository`
- `GradesAnalyticsRepository`
- `RiskAnalyticsRepository`
- `AggregateMetricsRepository`

### 14.3 DTOs

Create typed DTOs:

- `AnalyticsRequestDTO`
- `AnalyticsIntentDTO`
- `AnalyticsPlanDTO`
- `AnalyticsResultDTO`
- `ChartSpecDTO`
- `InsightDTO`
- `RecommendationDTO`
- `RiskScoreDTO`

### 14.4 Jobs

- `RefreshAnalyticsAggregatesJob`
- `RecomputeStudentRiskScoresJob`
- `GenerateAnalyticsExportJob`
- `DetectAnalyticsAnomaliesJob`
- `WarmAnalyticsCacheJob`

---

## 15. API Design

### 15.1 Copilot APIs

- `POST /api/analytics/copilot/query`
- `POST /api/analytics/copilot/follow-up`
- `GET /api/analytics/copilot/conversations`
- `GET /api/analytics/copilot/conversations/{id}`
- `POST /api/analytics/copilot/conversations/{id}/export`

### 15.2 Structured Analytics APIs

- `GET /api/analytics/overview`
- `GET /api/analytics/metrics`
- `POST /api/analytics/query`
- `GET /api/analytics/insights`
- `GET /api/analytics/recommendations`
- `GET /api/analytics/risk/students`
- `GET /api/analytics/predictions`
- `GET /api/analytics/anomalies`
- `GET /api/analytics/charts/{resultId}`

### 15.3 Catalog APIs

- `GET /api/analytics/catalog/metrics`
- `GET /api/analytics/catalog/dimensions`
- `GET /api/analytics/catalog/filters`

### 15.4 Example Copilot Response

```json
{
  "conversation_id": "conv_123",
  "message_id": "msg_456",
  "intent": {
    "family": "risk_analysis",
    "name": "students_at_risk",
    "confidence": 0.95
  },
  "scope": {
    "type": "trainer_assigned_groups",
    "masked": false
  },
  "summary": "7 students in your assigned groups are currently high risk, driven mostly by low attendance and falling grades.",
  "insights": [
    {
      "title": "Attendance is the main driver",
      "detail": "5 of the 7 high-risk students are below 75% attendance."
    }
  ],
  "recommendations": [
    {
      "type": "intervention",
      "label": "Schedule follow-up with 5 attendance-critical students",
      "priority": "high"
    }
  ],
  "charts": [
    {
      "type": "bar",
      "title": "Top at-risk students",
      "x": "student_name",
      "y": "risk_score"
    }
  ],
  "data": [...],
  "meta": {
    "trace_id": "trace_abc",
    "cache_hit": true,
    "generated_at": "2026-05-10T14:30:00Z"
  }
}
```

---

## 16. Security Protections

### 16.1 Core Protections

- strict auth and role middleware
- mandatory scoped query context
- request rate limiting
- tenant and role audit logging
- export authorization checks
- anti-prompt-injection validation
- response redaction and small-cohort suppression

### 16.2 LLM-Specific Protections

- no raw SQL generation
- no tool access beyond registered analytics tools
- strict JSON schema outputs
- content moderation for prompt abuse if external models are used
- strip prompt injection phrases from user requests before orchestration
- never expose schema internals or hidden system instructions

### 16.3 Query Abuse Protection

- max date range caps by role
- max drilldown row counts
- max export size
- query complexity scoring
- reject disallowed dimensions
- cache expensive repeated prompts

### 16.4 Audit Requirements

Log:

- user id
- tenant id
- role
- normalized intent
- filters
- scope hash
- execution time
- cache hit/miss
- export action
- anomaly or risk model version used

---

## 17. Performance Optimizations

### 17.1 Immediate Optimizations

- replace per-student looped risk calculations with grouped SQL
- move repeated dashboard queries to summary tables
- cache scope resolution maps
- precompute monthly trend tables
- paginate student-level drilldowns

### 17.2 Query Optimization Tactics

- use `EXPLAIN ANALYZE` on top analytics queries
- avoid `whereDate()` on indexed columns when possible; prefer range comparisons
- use integer surrogate keys for group/module/student dimensions
- add covering indexes for common filter combinations
- minimize large `whereIn` sets via join tables or scope tables when needed

### 17.3 Async Offloading

Make async:

- exports
- forecasts
- anomaly scans
- cache warmers
- large cohort recomputations

---

## 18. Suggested UI/UX

### 18.1 Analytics Copilot Experience

Build a split-screen analytics experience:

- left panel: conversation history and saved prompts
- center: copilot answer, charts, drilldowns
- right panel: active filters, scope badge, recommended next actions

### 18.2 Essential UX Elements

- visible scope badge: "Showing only assigned groups"
- editable filters chips
- follow-up suggestions
- chart switcher
- insight confidence labels
- export and share controls
- saved views and scheduled report actions

### 18.3 UX Patterns Inspired By Modern SaaS

- ask box with examples
- auto-generated executive summary card
- KPI cards above detailed results
- tabs: `Summary`, `Chart`, `Table`, `Drivers`, `Recommendations`
- "Explain this drop" action from a chart point

### 18.4 Trust UX

Always show:

- what data was used
- time range
- role scope
- freshness timestamp
- whether result came from prediction vs actuals

---

## 19. Suggested Charts

### 19.1 Core Charts

- line chart: attendance trend over time
- bar chart: average grade by module
- stacked bar: present/late/absent mix by group
- heatmap: absences by weekday and hour
- scatter plot: attendance rate vs average grade
- area chart: high-risk count over time
- box plot later: grade spread by group
- table with conditional formatting: top intervention targets

### 19.2 Chart Recommendation Rules

- trend query -> line
- rank query -> horizontal bar
- distribution query -> histogram/bar
- relationship query -> scatter
- part-to-whole query -> stacked bar, rarely pie
- risk cohort query -> bar + table

---

## 20. Example Production-Ready Responses

### 20.1 Trainer Response

Query:
"Which students in my groups are at risk this month?"

Response:

- Summary: `7 students in your assigned groups are high or medium risk this month. The strongest common driver is attendance below 80%.`
- Insights:
  - `3 students have both falling grades and repeated absences.`
  - `Module M101 contributes most to low performance this month.`
- Recommendations:
  - `Schedule attendance follow-up for the 4 students below 70% attendance.`
  - `Assign remediation for M101 before the next evaluation.`

### 20.2 Parent Response

Query:
"How is my child doing compared with last month?"

Response:

- Summary: `Your child’s attendance improved from 82% to 91%, and average grade increased from 11.4 to 12.1.`
- Insights:
  - `The biggest improvement was in attendance consistency.`
  - `Mathematics-related module performance is still below the student’s best subjects.`
- Recommendations:
  - `Maintain current attendance pattern.`
  - `Focus revision on the two lowest-scoring modules this week.`

### 20.3 Director Response

Query:
"Show me the groups with the biggest attendance drop in the last 30 days."

Response:

- Summary: `3 groups show a significant attendance decline over the last 30 days, led by TSGE1A with a 12-point drop.`
- Insights:
  - `The decline started in the second week of the month.`
  - `Late arrivals increased before full absences increased.`
- Recommendations:
  - `Investigate timetable friction and trainer load for the impacted groups.`
  - `Trigger automated outreach for students with 3+ absences in the last 2 weeks.`

---

## 21. Advanced Analytics Ideas Inspired By Power BI Copilot And SaaS Dashboards

### 21.1 Advanced Copilot Features

- "Explain this chart" on any widget
- "What changed?" period-over-period root cause summaries
- natural language drilldown
- saved analytics playbooks by role
- proactive insight feed on homepage
- anomaly alerts with one-click investigation

### 21.2 Smart Dashboard Behaviors

- auto-highlight statistically important changes
- recommended next questions under each answer
- pinned executive insights for directors
- intervention queue for at-risk students
- one-click filter propagation across widgets

### 21.3 Higher-Maturity Features

- benchmark groups against filiere averages
- intervention effectiveness tracking
- causal hypothesis assistant
- narrative monthly academic health report
- cohort progression journey analytics
- attendance-to-performance correlation explorer

### 21.4 SaaS Maturity Features

- tenant-level analytics configuration
- per-tenant KPI catalog customization
- multilingual analytics explanations
- scheduled insight digests by email
- usage analytics for copilot adoption
- prompt analytics to improve intent models

---

## 22. Recommended Implementation Roadmap

### Phase 1

- create analytics scope resolver
- create metric + dimension registry
- refactor current assistant into orchestrator + engines
- add conversation persistence
- add structured chart schema responses
- add summary tables for attendance and grades

### Phase 2

- add anomaly engine
- add weighted risk engine
- add recommendation engine
- add saved conversations and exports
- add observability dashboards

### Phase 3

- add predictive scoring jobs
- add advanced comparative analytics
- add proactive alerts feed
- add scheduled reports

### Phase 4

- external ML scoring service if scale demands it
- vector knowledge layer for semantic KPI help
- tenant-custom analytics packs

---

## 23. Immediate Refactor Recommendations For Current Codebase

Based on the current implementation:

1. Replace current `IntentParserService` with a two-stage `AnalyticsIntentClassifier`.
2. Split `AiAssistantService` into orchestration, execution, insight, and response synthesis services.
3. Remove duplicated scope logic from `AiAssistantService` and `AnalyticsService` into one `AnalyticsScopeResolver`.
4. Replace row-by-row risk computation in `AnalyticsService::riskInsights()` with batched aggregate SQL or precomputed risk tables.
5. Introduce conversation persistence instead of frontend-only chat history.
6. Add a plan-based query execution model instead of direct `match` branching on intent.
7. Expand frontend chart schema beyond `bar|line|pie` to include stacked bar, heatmap, scatter, and table metadata.
8. Add cache invalidation based on attendance and grade write events.
9. Create analytics aggregate tables for dashboard and copilot speed.
10. Add audit trails for all AI analytics requests and exports.

---

## 24. Final Recommendation

For this Laravel + React school platform, the best production architecture is:

- Laravel remains the secure orchestration authority
- MySQL 8 remains the primary store, augmented with analytics summary tables
- Redis handles cache, memory fragments, locks, and rate limiting
- queues handle heavy analytics computation
- LLMs are constrained to classification, explanation, and summarization only
- all metric execution remains deterministic, scoped, auditable, and explainable

This gives you a copilot that feels modern like Power BI Copilot while staying safer, faster, and more controllable for an education SaaS platform.
