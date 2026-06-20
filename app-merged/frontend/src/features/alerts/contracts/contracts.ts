export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory = 'attendance' | 'academic' | 'system' | 'behavioral';

export interface AlertRecord {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  affectedEntities: string[]; // e.g. "student:123"
  recommendation?: string;
  triggeredAt: string; // ISO8601
  sourceEvent?: string; // The DomainEventType that triggered this
  metadata?: Record<string, unknown>;
}

export interface AlertTrigger<T = unknown> {
  id: string;
  name: string;
  description: string;
  category: AlertCategory;
  evaluate: (payload: T, context?: unknown) => boolean;
  generateAlert: (payload: T, context?: unknown) => Omit<AlertRecord, 'id' | 'triggeredAt'>;
}
