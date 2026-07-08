export interface User {
  id: string;
  email: string;
  avatar?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export type AuthSession = AuthResponse;
