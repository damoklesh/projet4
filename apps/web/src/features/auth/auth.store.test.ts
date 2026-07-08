import { authApi } from './auth.api';
import { useAuthStore } from './auth.store';

vi.mock('./auth.api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

describe('auth.store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('starts unauthenticated', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('stores the returned JWT and public user after registration succeeds', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 'user-id',
        email: 'user@example.com',
        avatar: null,
      },
    } as Awaited<ReturnType<typeof authApi.register>>);

    await useAuthStore.getState().register({
      email: 'user@example.com',
      password: 'Password123',
    });

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'jwt-token',
      isAuthenticated: true,
      user: {
        id: 'user-id',
        email: 'user@example.com',
        avatar: null,
      },
    });
    expect(localStorage.getItem('datashare.auth')).toContain('jwt-token');
  });

  it('exposes duplicate email errors from the API', async () => {
    vi.mocked(authApi.register).mockRejectedValue(new Error('Un compte existe déjà pour cet email.'));

    await expect(
      useAuthStore.getState().register({
        email: 'user@example.com',
        password: 'Password123',
      }),
    ).rejects.toThrow('Un compte existe déjà pour cet email.');

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      error: 'Un compte existe déjà pour cet email.',
    });
  });
});
