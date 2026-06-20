import type { CopilotIntent, CopilotMemoryState } from '../contracts';

export const INITIAL_COPILOT_MEMORY: CopilotMemoryState = {
  lastFilters: {},
  lastTimeRangePreset: 'none',
};

export function updateCopilotMemory(previous: CopilotMemoryState, intent: CopilotIntent): CopilotMemoryState {
  return {
    lastIntent: intent.name,
    lastFilters: {
      ...previous.lastFilters,
      ...intent.filters,
    },
    lastModuleCode: intent.moduleCode ?? previous.lastModuleCode,
    lastTimeRangePreset: intent.timeRange.preset,
  };
}
