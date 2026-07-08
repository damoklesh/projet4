import { httpClient } from '../../services/http-client';
import { authApi } from './auth.api';

vi.mock('../../services/http-client', () => ({
  httpClient: vi.fn(),
}));

describe('auth.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits registration credentials to POST /auth/register', async () => {
    vi.mocked(httpClient).mockResolvedValue({
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 'user-id',
        email: 'user@example.com',
        avatar: null,
      },
    });

    await authApi.register({
      email: 'user@example.com',
      password: 'Password123',
    });

    expect(httpClient).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'Password123',
      }),
    });
  });

  it('submits login credentials to POST /auth/login', async () => {
    vi.mocked(httpClient).mockResolvedValue({
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 'user-id',
        email: 'user@example.com',
        avatar: null,
      },
    });

    await authApi.login({
      email: 'user@example.com',
      password: 'Password123',
    });

    expect(httpClient).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'Password123',
      }),
    });
  });
});
