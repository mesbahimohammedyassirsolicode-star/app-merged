import { DomainEventType, AppDomainEvent, AttendanceUpdatedEvent, StudentRiskChangedEvent, GradeUpdatedEvent } from '../../realtime/contracts/events';
import { AlertTrigger, AlertRecord } from '../contracts/contracts';
import { evaluateAttendanceDrop, evaluateRepeatedAbsences } from '../rules/attendanceRules';
import { evaluateHighRiskScore, evaluatePerformanceDecline } from '../rules/academicRules';

// Define specific triggers
export const triggers: Record<string, AlertTrigger<any>[]> = {
  'attendance.updated': [
    {
      id: 'attendance_drop_trigger',
      name: 'Significant Attendance Drop',
      description: 'Detects if attendance rate drops below critical threshold compared to last week',
      category: 'attendance',
      evaluate: (payload: AttendanceUpdatedEvent['payload'], context: { currentRate: number, previousRate: number }) => {
        // Here we assume context provides the aggregated rates after the event
        return evaluateAttendanceDrop(context.currentRate, context.previousRate, 15);
      },
      generateAlert: (payload, context) => ({
        category: 'attendance',
        severity: 'warning',
        title: 'Significant Attendance Drop',
        description: `Student attendance has dropped by more than 15%.`,
        affectedEntities: [`student:${payload.studentId}`],
        recommendation: 'Schedule an intervention meeting with the student.',
        sourceEvent: 'attendance.updated',
        metadata: { studentId: payload.studentId, moduleId: payload.moduleId, ...context }
      })
    },
    {
      id: 'repeated_absences_trigger',
      name: 'Repeated Consecutive Absences',
      description: 'Detects 3 or more consecutive absences',
      category: 'attendance',
      evaluate: (payload: AttendanceUpdatedEvent['payload'], context: { consecutiveAbsences: number }) => {
        return payload.status === 'absent' && evaluateRepeatedAbsences(context.consecutiveAbsences, 3);
      },
      generateAlert: (payload, context) => ({
        category: 'attendance',
        severity: 'critical',
        title: 'Repeated Absences',
        description: `Student has missed 3 or more consecutive classes in module ${payload.moduleId}.`,
        affectedEntities: [`student:${payload.studentId}`, `module:${payload.moduleId}`],
        recommendation: 'Contact parents and issue a formal warning.',
        sourceEvent: 'attendance.updated',
        metadata: { studentId: payload.studentId, moduleId: payload.moduleId, ...context }
      })
    }
  ],
  'student.risk_changed': [
    {
      id: 'high_risk_score_trigger',
      name: 'Critical Risk Score Reached',
      description: 'Detects when a student enters critical risk level',
      category: 'academic',
      evaluate: (payload: StudentRiskChangedEvent['payload']) => {
        return payload.newRiskLevel === 'critical' && payload.previousRiskLevel !== 'critical';
      },
      generateAlert: (payload) => ({
        category: 'academic',
        severity: 'critical',
        title: 'Critical Academic Risk',
        description: `Student risk level escalated to critical. Reason: ${payload.reason}`,
        affectedEntities: [`student:${payload.studentId}`],
        recommendation: 'Immediate academic counseling required.',
        sourceEvent: 'student.risk_changed',
        metadata: { studentId: payload.studentId, reason: payload.reason }
      })
    }
  ],
  'grade.updated': [
    {
      id: 'performance_decline_trigger',
      name: 'Module Performance Decline',
      description: 'Detects significant drop in module grades',
      category: 'academic',
      evaluate: (payload: GradeUpdatedEvent['payload']) => {
        if (!payload.oldGrade) return false;
        return evaluatePerformanceDecline(payload.newGrade, payload.oldGrade, 20);
      },
      generateAlert: (payload) => ({
        category: 'academic',
        severity: 'warning',
        title: 'Performance Decline',
        description: `Student grade dropped significantly by 20% or more.`,
        affectedEntities: [`student:${payload.studentId}`, `module:${payload.moduleId}`],
        recommendation: 'Assign remedial exercises or tutoring.',
        sourceEvent: 'grade.updated',
        metadata: { studentId: payload.studentId, moduleId: payload.moduleId, newGrade: payload.newGrade, oldGrade: payload.oldGrade }
      })
    }
  ]
};

/**
 * Returns all triggers associated with a specific event type.
 */
export const getTriggersForEvent = (eventType: DomainEventType): AlertTrigger<any>[] => {
  return triggers[eventType] || [];
};
