import { fileAssetsApi } from './file-assets.api';
import { useFileAssetsStore } from './file-assets.store';

vi.mock('./file-assets.api', () => ({
  fileAssetsApi: {
    delete: vi.fn(),
    history: vi.fn(),
    upload: vi.fn(),
  },
}));

describe('file-assets.store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFileAssetsStore.setState({
      history: [createHistoryItem()],
      totalItems: 1,
      totalPages: 1,
      page: 1,
      pageSize: 10,
      lastUpload: null,
      isLoading: false,
      error: null,
    });
  });

  it('removes a file from the current history after deletion succeeds', async () => {
    vi.mocked(fileAssetsApi.delete).mockResolvedValue({
      id: 'file-id',
      status: 'deleted',
    });

    await useFileAssetsStore.getState().deleteFile('file-id');

    expect(fileAssetsApi.delete).toHaveBeenCalledWith('file-id');
    expect(useFileAssetsStore.getState()).toMatchObject({
      history: [],
      totalItems: 0,
      isLoading: false,
      error: null,
    });
  });

  it('stores authorization errors when deletion fails', async () => {
    vi.mocked(fileAssetsApi.delete).mockRejectedValue(new Error('You can delete only your own files.'));

    await expect(useFileAssetsStore.getState().deleteFile('file-id')).rejects.toThrow(
      'You can delete only your own files.',
    );

    expect(useFileAssetsStore.getState()).toMatchObject({
      history: [expect.objectContaining({ id: 'file-id' })],
      totalItems: 1,
      isLoading: false,
      error: 'You can delete only your own files.',
    });
  });
});

function createHistoryItem() {
  return {
    id: 'file-id',
    fileName: 'document.pdf',
    mimeType: 'application/pdf',
    size: 245760,
    uploadedAt: '2026-07-08T10:30:00.000Z',
    expiresAt: '2026-07-15T10:30:00.000Z',
    status: 'active' as const,
    isPasswordProtected: true,
    tags: [{ id: 'tag-id', name: 'facture' }],
    shareLink: {
      url: 'http://localhost:5173/share/share-token',
      token: 'share-token',
      expiresAt: '2026-07-15T10:30:00.000Z',
      isPasswordProtected: true,
    },
  };
}
