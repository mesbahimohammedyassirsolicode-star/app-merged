export type InterventionStatus =
  | 'pending'
  | 'assigned'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'dismissed';

export type InterventionPriority = 'low' | 'medium' | 'high';

export interface InterventionAction {
  id: string;
  type: string;
  description: string;
  completedAt?: string; // ISO8601, null if incomplete
  completedBy?: string;
}

export interface InterventionTimelineEntry {
  id: string;
  type: 'status_change' | 'action_completed' | 'note_added' | 'created';
  description: string;
  timestamp: string; // ISO8601
  actorId?: string | 'system';
  metadata?: Record<string, unknown>;
}

export interface InterventionRecord {
  id: string;
  alertId: string;
  title: string;
  description: string;
  studentId?: number;
  moduleId?: number;
  assignedTo?: string; // userId
  status: InterventionStatus;
  priority: InterventionPriority;
  actions: InterventionAction[];
  timeline: InterventionTimelineEntry[];
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
  dueDate?: string; // ISO8601
}
