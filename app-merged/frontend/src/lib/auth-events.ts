const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

let unauthorizedDispatched = false;

export function dispatchUnauthorizedEvent(): void {
  if (unauthorizedDispatched) {
    return;
  }

  unauthorizedDispatched = true;
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
}

export function resetUnauthorizedEvent(): void {
  unauthorizedDispatched = false;
}

export function subscribeToUnauthorized(handler: EventListener): () => void {
  window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handler);

  return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handler);
}
