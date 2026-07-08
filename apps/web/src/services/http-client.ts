import type { ApiResponseEnvelope, ProblemDetails } from '@datashare/shared';
import { ApiError } from './api-error';
import { clearStoredAuthSession, getStoredAuthToken } from './auth-session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export async function httpClient<TData>(path: string, options: RequestInit = {}): Promise<TData> {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredAuthToken();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  if (response.status === 204) {
    return undefined as TData;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/octet-stream')) {
    return response.blob() as Promise<TData>;
  }

  const envelope = (await response.json()) as ApiResponseEnvelope<TData>;
  return envelope.data;
}

async function handleErrorResponse(response: Response): Promise<never> {
  const contentType = response.headers.get('content-type') ?? '';
  const problem = contentType.includes('application/problem+json')
    ? ((await response.json()) as ProblemDetails)
    : undefined;

  if (response.status === 401) {
    clearStoredAuthSession();
    window.location.assign('/login');
  }

  throw new ApiError(problem?.detail ?? response.statusText, response.status, problem);
}
