import { BaseDomainEvent } from '../contracts/events';

/**
 * Tracer for realtime events to provide observability and debugging
 * capabilities for cache invalidations.
 */
export const traceEvent = (
  event: BaseDomainEvent<any>, 
  invalidatedKeys: unknown[][],
  wasIgnored: boolean = false
) => {
  // In production, you might want to send this to Datadog/Sentry or an analytics backend
  // For now, we use structured console logging for debugging.

  if (process.env.NODE_ENV === 'production' && !window.localStorage.getItem('DEBUG_REALTIME')) {
    return;
  }

  const badgeColor = wasIgnored ? '#888' : '#3b82f6';
  
  console.groupCollapsed(
    `%c[Realtime]%c ${event.type} %c${wasIgnored ? '(Ignored)' : ''}`,
    `color: white; background: ${badgeColor}; padding: 2px 4px; border-radius: 4px;`,
    'color: inherit; font-weight: bold;',
    'color: gray;'
  );

  console.log('Timestamp:', new Date(event.timestamp).toLocaleString());
  console.log('Entity:', `${event.entityType}:${event.entityId}`);
  console.log('Trace ID:', event.metadata.traceId);
  console.log('Actor ID:', event.metadata.actorId || 'System');
  console.log('Payload:', event.payload);
  
  if (!wasIgnored) {
    console.log('Invalidated Cache Keys:');
    invalidatedKeys.forEach(key => {
      console.log('  ', key);
    });
  }

  console.groupEnd();
};
