# GIMS AI Copilot Orchestrator — Implementation Plan

## Architecture Analysis

The existing codebase already has a **sophisticated analytics copilot** infrastructure:
- **Backend**: `AnalyticsOrchestrator`, `IntentParserService`, `LLMService`, `AiAssistantService`, conversation tracking models
- **Frontend**: Full copilot feature folder with intent resolution, entity resolution, orchestration, transforms, and a chat panel

### What Needs to Change

| Phase | Status | Action |
|-------|--------|--------|
| 1. Copilot Architecture | ✅ Exists (rule-based) | Extend with **Gemini-powered** multi-agent orchestration |
| 2. Multi-Agent System | ❌ Missing | Create 6 dedicated agents (Academic, Attendance, Risk, Recommendation, Reporting, Analytics) |
| 3. Gemini Integration | ❌ Missing (uses OpenAI) | Replace `LLMService` → `GeminiService` with Gemini API |
| 4. Chat Memory | ⚠️ Partial (DB models exist) | Add persistent session management, API routes, conversation history UI |
| 5. AI Insights | ⚠️ Partial | Add auto-generated insights engine |
| 6. Smart Recommendations | ⚠️ Partial | Enhance recommendation engine with dynamic generation |
| 7. AI Dashboard | ❌ Missing | Create `/copilot` page with full SaaS dashboard |
| 8. Chart Generation | ✅ Exists | Extend with more chart types (Pie, Area) |
| 9. Report Generation | ⚠️ Partial (CSV/PDF export) | Add dedicated report buttons and types |
| 10. SaaS Experience | ❌ Missing | Complete UI overhaul with premium design |

## Implementation Strategy

### Approach: **Extend, Don't Replace**

We will:
1. Keep ALL existing functionality intact
2. Add new Gemini service alongside existing LLM service
3. Extend the analytics orchestrator with multi-agent routing
4. Create a new premium `/copilot` page (keep `/ai-assistant` working)
5. Add new API routes for copilot features without touching existing ones

### File Structure

```
Backend:
  app/Services/GeminiService.php          ← NEW: Gemini API integration
  app/Services/Copilot/                   ← NEW: Multi-agent system
    CopilotOrchestrator.php
    Agents/AcademicAgent.php
    Agents/AttendanceAgent.php
    Agents/RiskDetectionAgent.php
    Agents/RecommendationAgent.php
    Agents/ReportingAgent.php
    Agents/AnalyticsAgent.php
    AgentInterface.php
  app/Http/Controllers/CopilotController.php  ← NEW
  routes/api/copilot.php                      ← NEW
  database/migrations/..._create_copilot_tables.php

Frontend:
  src/pages/CopilotPage.tsx               ← NEW: Full SaaS copilot dashboard
  src/features/copilot/                   ← EXTEND existing
    components/                           ← NEW: Premium UI components
      CopilotChat.tsx
      CopilotInsightsPanel.tsx
      CopilotRecommendations.tsx
      CopilotReports.tsx
      CopilotAnalytics.tsx
      CopilotRiskAlerts.tsx
      CopilotCharts.tsx
      CopilotSessionSidebar.tsx
    services/copilotApi.ts                ← NEW: API client
    types/copilot.ts                      ← NEW: TypeScript types
```

## Execution Order

1. Backend: GeminiService + config
2. Backend: Multi-agent system  
3. Backend: CopilotController + routes
4. Backend: Database migration for sessions
5. Frontend: TypeScript types
6. Frontend: API service
7. Frontend: Component library
8. Frontend: CopilotPage
9. Frontend: Route registration
10. Integration testing
