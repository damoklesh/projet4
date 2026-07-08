import { create } from 'zustand';
import {
  AUTH_CLEARED_EVENT,
  clearStoredAuthSession,
  getStoredAuthSession,
  saveAuthSession,
} from '../../services/auth-session';
import { authApi } from './auth.api';
import type { AuthCredentials, User } from './auth.types';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hydrate: () => void;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
}

const emptyAuthState = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
};

function getInitialAuthState() {
  if (typeof window === 'undefined') {
    return emptyAuthState;
  }

  const session = getStoredAuthSession();

  if (!session) {
    return emptyAuthState;
  }

  return {
    accessToken: session.accessToken,
    user: session.user,
    isAuthenticated: true,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialAuthState(),
  isLoading: false,
  error: null,

  hydrate: () => {
    const session = getStoredAuthSession();

    if (session) {
      set({
        accessToken: session.accessToken,
        user: session.user,
        isAuthenticated: true,
      });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });

    try {
      const session = await authApi.login(credentials);
      saveAuthSession(session);
      set({
        accessToken: session.accessToken,
        user: session.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Login failed', isLoading: false });
      throw error;
    }
  },

  register: async (credentials) => {
    set({ isLoading: true, error: null });

    try {
      const session = await authApi.register(credentials);
      saveAuthSession(session);
      set({
        accessToken: session.accessToken,
        user: session.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Registration failed', isLoading: false });
      throw error;
    }
  },

  logout: () => {
    clearStoredAuthSession();
    set({ ...emptyAuthState, error: null, isLoading: false });
  },
}));

export const authSelectors = {
  user: (state: AuthState) => state.user,
  isAuthenticated: (state: AuthState) => state.isAuthenticated,
  isLoading: (state: AuthState) => state.isLoading,
};

if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_CLEARED_EVENT, () => {
    useAuthStore.setState({ ...emptyAuthState, error: null, isLoading: false });
  });
}
