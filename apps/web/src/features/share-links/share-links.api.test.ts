import { httpClient } from '../../services/http-client';
import { shareLinksApi } from './share-links.api';

vi.mock('../../services/http-client', () => ({
  httpClient: vi.fn(),
}));

describe('shareLinksApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads public metadata by token', async () => {
    vi.mocked(httpClient).mockResolvedValue({
      token: 'public-token',
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
      size: 12,
      uploadedAt: '2026-07-08T10:30:00.000Z',
      expiresAt: '2026-07-15T10:30:00.000Z',
      status: 'active',
      isPasswordProtected: false,
    });

    await shareLinksApi.metadata('public-token');

    expect(httpClient).toHaveBeenCalledWith('/share-links/public-token');
  });

  it('downloads public files without redirecting 401 errors to login', async () => {
    const blob = new Blob(['file-content'], { type: 'application/octet-stream' });
    vi.mocked(httpClient).mockResolvedValue(blob);

    await expect(shareLinksApi.download({ token: 'public-token', password: 'secret123' })).resolves.toBe(blob);

    expect(httpClient).toHaveBeenCalledWith('/share-links/public-token/download', {
      method: 'POST',
      body: JSON.stringify({ password: 'secret123' }),
      redirectOnUnauthorized: false,
    });
  });
});
