import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryPage } from './HistoryPage';

const { deleteFileMock, loadHistoryMock, logoutMock, storeState } = vi.hoisted(() => ({
  deleteFileMock: vi.fn(),
  loadHistoryMock: vi.fn(),
  logoutMock: vi.fn(),
  storeState: {
    current: undefined as
      | {
          deleteFile: ReturnType<typeof vi.fn>;
          error: string | null;
          history: Array<{
            id: string;
            fileName: string;
            mimeType: string;
            size: number;
            uploadedAt: string;
            expiresAt: string;
            status: 'active' | 'expired' | 'deleted';
            isPasswordProtected: boolean;
            tags: Array<{ id: string; name: string }>;
            shareLink: {
              url: string;
              token: string;
              expiresAt: string;
              isPasswordProtected: boolean;
            };
          }>;
          isLoading: boolean;
          loadHistory: ReturnType<typeof vi.fn>;
          page: number;
          pageSize: number;
          totalItems: number;
          totalPages: number;
        }
      | undefined,
  },
}));

vi.mock('../features/file-assets/file-assets.store', () => ({
  useFileAssetsStore: vi.fn((selector: (state: NonNullable<typeof storeState.current>) => unknown) =>
    selector(storeState.current as NonNullable<typeof storeState.current>),
  ),
}));

vi.mock('../features/auth/auth.store', () => ({
  useAuthStore: vi.fn(
    (selector: (state: { logout: ReturnType<typeof vi.fn>; user: { email: string } }) => unknown) =>
      selector({ logout: logoutMock, user: { email: 'user@example.com' } }),
  ),
}));

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadHistoryMock.mockResolvedValue(undefined);
    deleteFileMock.mockResolvedValue(undefined);
    storeState.current = {
      deleteFile: deleteFileMock,
      error: null,
      history: [createHistoryItem()],
      isLoading: false,
      loadHistory: loadHistoryMock,
      page: 1,
      pageSize: 10,
      totalItems: 25,
      totalPages: 3,
    };
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('loads and displays authenticated file history', async () => {
    render(<HistoryPage />);

    expect(screen.getByRole('heading', { name: /mes fichiers/i })).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText(/protege/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(loadHistoryMock).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        status: 'active',
        sort: 'uploadedAt',
        order: 'desc',
      });
    });
  });

  it('shows an empty state when no files match filters', () => {
    storeState.current = {
      ...storeState.current!,
      history: [],
      totalItems: 0,
      totalPages: 0,
    };

    render(<HistoryPage />);

    expect(screen.getByText(/aucun fichier/i)).toBeInTheDocument();
    expect(screen.getByText(/0 fichiers/i)).toBeInTheDocument();
  });

  it('applies the segmented status filter', async () => {
    render(<HistoryPage />);

    await userEvent.click(screen.getByRole('radio', { name: /expire/i }));

    await waitFor(() => {
      expect(loadHistoryMock).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 10,
        status: 'expired',
        sort: 'uploadedAt',
        order: 'desc',
      });
    });
  });

  it('shows expired files as non-actionable history rows', () => {
    storeState.current = {
      ...storeState.current!,
      history: [
        createHistoryItem({
          status: 'expired',
          shareLink: {
            url: '',
            token: '',
            expiresAt: '2026-07-15T10:30:00.000Z',
            isPasswordProtected: false,
          },
        }),
      ],
    };

    render(<HistoryPage />);

    expect(screen.getByText(/ce fichier a expire, il n'est plus stocke chez nous/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copier le lien/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /telecharger document.pdf/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /supprimer document.pdf/i })).not.toBeInTheDocument();
  });

  it('supports pagination and copy link actions', async () => {
    render(<HistoryPage />);

    await userEvent.click(screen.getByRole('button', { name: /suivant/i }));
    await waitFor(() => {
      expect(loadHistoryMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 10,
        }),
      );
    });

    await userEvent.click(screen.getByRole('button', { name: /copier le lien/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:5173/share/share-token');
    expect(await screen.findByText(/lien copie/i)).toBeInTheDocument();
  });

  it('asks for confirmation before deleting a file', async () => {
    render(<HistoryPage />);

    await userEvent.click(screen.getByRole('button', { name: /supprimer document.pdf/i }));

    expect(deleteFileMock).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: /supprimer le fichier/i })).toBeInTheDocument();
    expect(screen.getByText(/cette action est irreversible/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(deleteFileMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: /supprimer le fichier/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /supprimer document.pdf/i }));
    await userEvent.click(screen.getByRole('button', { name: /^supprimer$/i }));

    expect(deleteFileMock).toHaveBeenCalledWith('file-id');
  });

  it('displays authorization errors from failed deletion', () => {
    storeState.current = {
      ...storeState.current!,
      error: 'You can delete only your own files.',
    };

    render(<HistoryPage />);

    expect(screen.getByText(/delete only your own files/i)).toBeInTheDocument();
  });
});

function createHistoryItem(
  overrides: Partial<{
    status: 'active' | 'expired' | 'deleted';
    shareLink: {
      url: string;
      token: string;
      expiresAt: string;
      isPasswordProtected: boolean;
    };
  }> = {},
) {
  return {
    id: 'file-id',
    fileName: 'document.pdf',
    mimeType: 'application/pdf',
    size: 245760,
    uploadedAt: '2026-07-08T10:30:00.000Z',
    expiresAt: '2026-07-15T10:30:00.000Z',
    status: overrides.status ?? ('active' as const),
    isPasswordProtected: true,
    tags: [{ id: 'tag-id', name: 'facture' }],
    shareLink: overrides.shareLink ?? {
      url: 'http://localhost:5173/share/share-token',
      token: 'share-token',
      expiresAt: '2026-07-15T10:30:00.000Z',
      isPasswordProtected: true,
    },
  };
}
