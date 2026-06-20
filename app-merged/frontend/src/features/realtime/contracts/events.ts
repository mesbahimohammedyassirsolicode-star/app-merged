export type DomainEventType = 
  | 'attendance.updated'
  | 'grade.updated'
  | 'notification.created'
  | 'student.risk_changed'
  | 'analytics.refresh_requested';

export interface BaseDomainEvent<T = unknown> {
  type: DomainEventType;
  entityType: 'student' | 'module' | 'group' | 'attendance' | 'notification' | 'system';
  entityId?: string | number;
  timestamp: string; // ISO8601
  payload: T;
  metadata: {
    eventId: string;
    traceId: string;
    actorId?: string; // Who triggered it?
  };
}

// -- Specific Event Payloads --

export interface AttendanceUpdatedPayload {
  studentId: number;
  moduleId: number;
  status: 'present' | 'absent' | 'late';
  previousStatus?: 'present' | 'absent' | 'late';
}
export type AttendanceUpdatedEvent = BaseDomainEvent<AttendanceUpdatedPayload>;

export interface GradeUpdatedPayload {
  studentId: number;
  moduleId: number;
  newGrade: number;
  oldGrade?: number;
}
export type GradeUpdatedEvent = BaseDomainEvent<GradeUpdatedPayload>;

export interface NotificationCreatedPayload {
  id: string;
  title: string;
  message: string;
  actionUrl?: string;
  priority: 'low' | 'normal' | 'high';
}
export type NotificationCreatedEvent = BaseDomainEvent<NotificationCreatedPayload>;

export interface StudentRiskChangedPayload {
  studentId: number;
  previousRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  newRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}
export type StudentRiskChangedEvent = BaseDomainEvent<StudentRiskChangedPayload>;

export interface AnalyticsRefreshRequestedPayload {
  scope: 'global' | 'module' | 'student';
  scopeId?: number;
}
export type AnalyticsRefreshRequestedEvent = BaseDomainEvent<AnalyticsRefreshRequestedPayload>;

// Union type for all handled events
export type AppDomainEvent = 
  | AttendanceUpdatedEvent
  | GradeUpdatedEvent
  | NotificationCreatedEvent
  | StudentRiskChangedEvent
  | AnalyticsRefreshRequestedEvent;
