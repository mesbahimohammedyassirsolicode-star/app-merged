import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { 
  AppDomainEvent, 
  AttendanceUpdatedEvent, 
  GradeUpdatedEvent, 
  NotificationCreatedEvent, 
  StudentRiskChangedEvent,
  AnalyticsRefreshRequestedEvent
} from '../contracts/events';
import { traceEvent } from '../monitoring/tracer';

export class RealtimeInvalidator {
  constructor(private queryClient: QueryClient) {}

  public handleEvent(event: AppDomainEvent, currentUserId?: string) {
    // Safety Guardrail: Actor Rejection
    // If the event was triggered by the current user, we ignore it because 
    // the frontend has already performed an optimistic update locally.
    if (event.metadata.actorId && event.metadata.actorId === currentUserId) {
      traceEvent(event, [], true);
      return;
    }

    const invalidatedKeys: unknown[][] = [];

    switch (event.type) {
      case 'attendance.updated':
        this.handleAttendanceUpdated(event as AttendanceUpdatedEvent, invalidatedKeys);
        break;
      case 'grade.updated':
        this.handleGradeUpdated(event as GradeUpdatedEvent, invalidatedKeys);
        break;
      case 'notification.created':
        this.handleNotificationCreated(event as NotificationCreatedEvent, invalidatedKeys);
        break;
      case 'student.risk_changed':
        this.handleStudentRiskChanged(event as StudentRiskChangedEvent, invalidatedKeys);
        break;
      case 'analytics.refresh_requested':
        this.handleAnalyticsRefreshRequested(event as AnalyticsRefreshRequestedEvent, invalidatedKeys);
        break;
    }

    traceEvent(event, invalidatedKeys);
  }

  private handleAttendanceUpdated(event: AttendanceUpdatedEvent, invalidatedKeys: unknown[][]) {
    const { studentId, moduleId } = event.payload;

    // 1. Invalidate student overview
    const studentOverviewKey = queryKeys.analytics.overview('student', { studentId });
    this.queryClient.invalidateQueries({ queryKey: studentOverviewKey });
    invalidatedKeys.push(studentOverviewKey);

    // 2. Invalidate module aggregate attendance
    const moduleAttendanceKey = queryKeys.analytics.structuredQuery('attendance', 'module', { moduleId });
    this.queryClient.invalidateQueries({ queryKey: moduleAttendanceKey });
    invalidatedKeys.push(moduleAttendanceKey);

    // 3. Invalidate copilot context for this student (freshness)
    const copilotKey = ['copilot', 'insights', 'student', studentId];
    this.queryClient.invalidateQueries({ queryKey: copilotKey });
    invalidatedKeys.push(copilotKey);
  }

  private handleGradeUpdated(event: GradeUpdatedEvent, invalidatedKeys: unknown[][]) {
    const { studentId, moduleId } = event.payload;

    // Invalidate grades for specific module/student
    const gradeKey = ['analytics', 'structured', 'grades', 'module', { moduleId }];
    this.queryClient.invalidateQueries({ queryKey: gradeKey });
    invalidatedKeys.push(gradeKey);

    // Invalidate copilot context
    const copilotKey = ['copilot', 'insights', 'student', studentId];
    this.queryClient.invalidateQueries({ queryKey: copilotKey });
    invalidatedKeys.push(copilotKey);
  }

  private handleNotificationCreated(event: NotificationCreatedEvent, invalidatedKeys: unknown[][]) {
    // Invalidate notifications list and unread count
    // Assuming the user scope is for the currently logged in user since they received the event
    const notifKeys = queryKeys.notifications.all;
    this.queryClient.invalidateQueries({ queryKey: notifKeys });
    invalidatedKeys.push(notifKeys);
  }

  private handleStudentRiskChanged(event: StudentRiskChangedEvent, invalidatedKeys: unknown[][]) {
    const { studentId } = event.payload;

    // Invalidate student risk overview
    const riskKey = queryKeys.analytics.overview('student', { studentId });
    this.queryClient.invalidateQueries({ queryKey: riskKey });
    invalidatedKeys.push(riskKey);

    // Copilot Freshness: critical for risk changes
    const copilotKey = ['copilot', 'insights', 'student', studentId];
    this.queryClient.invalidateQueries({ queryKey: copilotKey });
    invalidatedKeys.push(copilotKey);
  }

  private handleAnalyticsRefreshRequested(event: AnalyticsRefreshRequestedEvent, invalidatedKeys: unknown[][]) {
    const { scope, scopeId } = event.payload;

    if (scope === 'global') {
      const allAnalyticsKey = queryKeys.analytics.all;
      this.queryClient.invalidateQueries({ queryKey: allAnalyticsKey });
      invalidatedKeys.push(allAnalyticsKey);
    } else {
      const scopedKey = queryKeys.analytics.overviewScope(scope);
      this.queryClient.invalidateQueries({ queryKey: scopedKey });
      invalidatedKeys.push(scopedKey);
    }
  }
}
