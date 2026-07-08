import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { shareLinksApi } from '../features/share-links/share-links.api';
import { ApiError } from '../services/api-error';
import { ShareLinkPage } from './ShareLinkPage';

vi.mock('../features/share-links/share-links.api', () => ({
  shareLinksApi: {
    metadata: vi.fn(),
    download: vi.fn(),
  },
}));

describe('ShareLinkPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(shareLinksApi.metadata).mockResolvedValue({
      token: 'public-token',
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
      size: 2048,
      uploadedAt: '2026-07-08T10:30:00.000Z',
      expiresAt: '2026-07-15T10:30:00.000Z',
      status: 'active',
      isPasswordProtected: true,
    });
    vi.mocked(shareLinksApi.download).mockResolvedValue(
      new Blob(['file-content'], { type: 'application/octet-stream' }),
    );
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:download-url'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
  });

  it('loads and displays public metadata with a password field when required', async () => {
    renderShareLinkPage();

    expect(await screen.findByRole('heading', { name: /telecharger un fichier/i })).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.0 Ko')).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(shareLinksApi.metadata).toHaveBeenCalledWith('public-token');
  });

  it('shows a clear error screen for expired links', async () => {
    vi.mocked(shareLinksApi.metadata).mockRejectedValue(
      new ApiError('Share link has expired.', 410, {
        type: 'https://datashare.local/problems/410',
        title: 'Gone',
        status: 410,
        detail: 'Share link has expired.',
      }),
    );

    renderShareLinkPage();

    expect(await screen.findByText(/plus disponible ou le lien a expire/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /telecharger/i })).not.toBeInTheDocument();
  });

  it('submits the password and saves the returned binary file', async () => {
    renderShareLinkPage();

    await screen.findByRole('heading', { name: /telecharger un fichier/i });
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /telecharger/i }));

    expect(shareLinksApi.download).toHaveBeenCalledWith({
      token: 'public-token',
      password: 'secret123',
    });
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:download-url');
    expect(await screen.findByText(/telechargement demarre/i)).toBeInTheDocument();
  });
});

function renderShareLinkPage() {
  return render(
    <MemoryRouter initialEntries={['/share/public-token']}>
      <Routes>
        <Route path="/share/:token" element={<ShareLinkPage />} />
      </Routes>
    </MemoryRouter>,
  );
}
