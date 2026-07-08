import type { AuthSession } from '../features/auth/auth.types';

const STORAGE_KEY = 'datashare.auth';
export const AUTH_CLEARED_EVENT = 'datashare:auth-cleared';

export function getStoredAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function getStoredAuthToken(): string | null {
  return getStoredAuthSession()?.accessToken ?? null;
}

export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuthSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
}
