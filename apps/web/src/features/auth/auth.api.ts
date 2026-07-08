import { httpClient } from '../../services/http-client';
import type { AuthCredentials, AuthResponse } from './auth.types';

export const authApi = {
  register(credentials: AuthCredentials): Promise<AuthResponse> {
    return httpClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  login(credentials: AuthCredentials): Promise<AuthResponse> {
    return httpClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
};
