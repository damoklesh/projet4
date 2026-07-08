import { httpClient } from './http-client';

describe('httpClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds Authorization: Bearer <token> when a JWT is stored', async () => {
    localStorage.setItem(
      'datashare.auth',
      JSON.stringify({
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: 'user-id',
          email: 'user@example.com',
          avatar: null,
        },
      }),
    );
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ status: 'success', message: 'OK', data: { items: [] } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await httpClient('/me/file-assets');

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer jwt-token');
  });

  it('clears auth state on 401 application/problem+json responses', async () => {
    localStorage.setItem(
      'datashare.auth',
      JSON.stringify({
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: 'user-id',
          email: 'user@example.com',
          avatar: null,
        },
      }),
    );
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          type: 'https://datashare.local/problems/401',
          title: 'Unauthorized',
          status: 401,
          detail: 'Invalid email or password.',
        }),
        {
          status: 401,
          headers: { 'content-type': 'application/problem+json' },
        },
      ),
    );

    await expect(httpClient('/me/file-assets')).rejects.toMatchObject({
      status: 401,
      message: 'Invalid email or password.',
    });
    expect(localStorage.getItem('datashare.auth')).toBeNull();
  });

  it('does not clear auth state or redirect on 401 when redirectOnUnauthorized is false', async () => {
    localStorage.setItem(
      'datashare.auth',
      JSON.stringify({
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: 'user-id',
          email: 'user@example.com',
          avatar: null,
        },
      }),
    );
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          type: 'https://datashare.local/problems/401',
          title: 'Unauthorized',
          status: 401,
          detail: 'A valid password is required.',
        }),
        {
          status: 401,
          headers: { 'content-type': 'application/problem+json' },
        },
      ),
    );

    await expect(httpClient('/share-links/token/download', { redirectOnUnauthorized: false })).rejects.toMatchObject({
      status: 401,
      message: 'A valid password is required.',
    });
    expect(localStorage.getItem('datashare.auth')).not.toBeNull();
  });
});
