import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryPage } from './HistoryPage';

const { deleteFileMock, loadHistoryMock, storeState } = vi.hoisted(() => ({
  deleteFileMock: vi.fn(),
  loadHistoryMock: vi.fn(),
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

    expect(screen.getByRole('heading', { name: /history/i })).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('facture')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    await waitFor(() => {
      expect(loadHistoryMock).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        status: 'active',
        tag: undefined,
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

    expect(screen.getByText(/no files match/i)).toBeInTheDocument();
    expect(screen.getByText(/0 files/i)).toBeInTheDocument();
  });

  it('applies status, tag, sorting and page size filters', async () => {
    render(<HistoryPage />);

    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'expired');
    await userEvent.type(screen.getByLabelText(/tag/i), 'facture');
    await userEvent.selectOptions(screen.getByLabelText(/sort/i), 'size');
    await userEvent.selectOptions(screen.getByLabelText(/order/i), 'asc');
    await userEvent.selectOptions(screen.getByLabelText(/page size/i), '25');

    await waitFor(() => {
      expect(loadHistoryMock).toHaveBeenLastCalledWith({
        page: 1,
        pageSize: 25,
        status: 'expired',
        tag: 'facture',
        sort: 'size',
        order: 'asc',
      });
    });
  });

  it('supports pagination and copy link actions', async () => {
    render(<HistoryPage />);

    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => {
      expect(loadHistoryMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 10,
        }),
      );
    });

    await userEvent.click(screen.getByRole('button', { name: /copy link/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:5173/share/share-token');
    expect(await screen.findByText(/share link copied/i)).toBeInTheDocument();
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
