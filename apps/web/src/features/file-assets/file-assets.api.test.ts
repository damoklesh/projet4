import { httpClient } from '../../services/http-client';
import { fileAssetsApi } from './file-assets.api';

vi.mock('../../services/http-client', () => ({
  httpClient: vi.fn(),
}));

describe('fileAssetsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends upload data as multipart/form-data with US01 field names', async () => {
    vi.mocked(httpClient).mockResolvedValue({
      fileAsset: {
        id: 'file-id',
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 5,
        uploadedAt: '2026-07-08T10:30:00.000Z',
        expiresAt: '2026-07-15T10:30:00.000Z',
        status: 'active',
        isPasswordProtected: true,
        tags: [{ id: 'tag-id', name: 'facture' }],
      },
      shareLink: {
        url: 'http://localhost:5173/share/token',
        token: 'token',
        expiresAt: '2026-07-15T10:30:00.000Z',
        isPasswordProtected: true,
      },
    });

    const file = new File(['hello'], 'document.pdf', { type: 'application/pdf' });
    await fileAssetsApi.upload({
      file,
      password: 'secret1',
      expirationDays: 7,
      tags: 'facture',
    });

    expect(httpClient).toHaveBeenCalledWith('/file-assets', {
      method: 'POST',
      body: expect.any(FormData),
    });
    const formData = vi.mocked(httpClient).mock.calls[0][1]?.body as FormData;
    expect(formData.get('file')).toBe(file);
    expect(formData.get('password')).toBe('secret1');
    expect(formData.get('expirationDays')).toBe('7');
    expect(formData.get('tags')).toBe('facture');
    expect(formData.get('expiresInDays')).toBeNull();
  });
});
