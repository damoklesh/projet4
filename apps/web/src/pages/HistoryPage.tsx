import { ChevronLeft, ChevronRight, LogOut, Menu, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FileStatusFilter } from '@datashare/shared';
import { FileHistoryList } from '../components/file/FileHistoryList';
import { AppShell } from '../components/layout/AppShell';
import { MobileDrawer } from '../components/layout/MobileDrawer';
import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
import { Modal } from '../components/ui/Modal';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { useAuthStore } from '../features/auth/auth.store';
import { useFileAssetsStore } from '../features/file-assets/file-assets.store';
import type { FileAssetHistoryItem } from '../features/file-assets/file-assets.types';

export function HistoryPage() {
  const { logout, user } = useAuthStore((state) => ({
    logout: state.logout,
    user: state.user,
  }));
  const { deleteFile, error, history, isLoading, loadHistory, page, pageSize, totalItems, totalPages } = useFileAssetsStore(
    (state) => ({
      deleteFile: state.deleteFile,
      error: state.error,
      history: state.history,
      isLoading: state.isLoading,
      loadHistory: state.loadHistory,
      page: state.page,
      pageSize: state.pageSize,
      totalItems: state.totalItems,
      totalPages: state.totalPages,
    }),
  );
  const [status, setStatus] = useState<FileStatusFilter>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filePendingDeletion, setFilePendingDeletion] = useState<FileAssetHistoryItem | null>(null);

  useEffect(() => {
    void loadHistory({
      page: currentPage,
      pageSize: 10,
      status,
      sort: 'uploadedAt',
      order: 'desc',
    });
  }, [currentPage, loadHistory, status]);

  async function handleCopyShareLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopyMessage('Lien copie.');
  }

  async function handleConfirmDelete() {
    if (!filePendingDeletion) {
      return;
    }

    try {
      await deleteFile(filePendingDeletion.id);
      setFilePendingDeletion(null);
    } catch {
      setFilePendingDeletion(null);
    }
  }

  function handleLogout() {
    logout();
    window.location.assign('/login');
  }

  return (
    <AppShell>
      <div className="history-topbar">
        <Button
          aria-expanded={drawerOpen}
          aria-label="Ouvrir le menu"
          className="mobile-menu-button"
          icon={<Menu size={14} />}
          onClick={() => setDrawerOpen(true)}
          size="sm"
          variant="ghost"
        >
          Menu
        </Button>
        <span className="header__user">{user?.email}</span>
        <Button icon={<LogOut size={13} />} onClick={handleLogout} size="sm" variant="dark">
          Deconnexion
        </Button>
      </div>

      <div className="history-header">
        <h1 className="history-title">Mes fichiers</h1>
        <Button
          aria-label="Actualiser"
          icon={<RefreshCw size={13} />}
          onClick={() =>
            void loadHistory({
              page: currentPage,
              pageSize: 10,
              status,
              sort: 'uploadedAt',
              order: 'desc',
            })
          }
          size="sm"
          variant="ghost"
        >
          Actualiser
        </Button>
      </div>

      <div className="history-toolbar">
        <SegmentedControl
          ariaLabel="Filtrer les fichiers"
          onChange={(value) => {
            setStatus(value);
            setCurrentPage(1);
          }}
          options={[
            { label: 'Tous', value: 'all' },
            { label: 'Actifs', value: 'active' },
            { label: 'Expire', value: 'expired' },
          ]}
          value={status}
        />
      </div>

      {error ? <Callout tone="danger">{error}</Callout> : null}
      {copyMessage ? <Callout tone="success">{copyMessage}</Callout> : null}

      <FileHistoryList
        items={history}
        onCopyShareLink={(url) => void handleCopyShareLink(url)}
        onDelete={(fileAssetId) => {
          setFilePendingDeletion(history.find((item) => item.id === fileAssetId) ?? null);
        }}
      />

      <div className="pagination-bar">
        <p className="muted">
          {isLoading
            ? 'Chargement...'
            : `${totalItems} fichiers, page ${page} sur ${Math.max(totalPages, 1)}, ${pageSize} par page`}
        </p>
        <div className="pagination-actions">
          <Button
            disabled={currentPage <= 1 || isLoading}
            icon={<ChevronLeft size={13} />}
            onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
            size="sm"
            variant="primary"
          >
            Precedent
          </Button>
          <Button
            disabled={currentPage >= totalPages || totalPages === 0 || isLoading}
            icon={<ChevronRight size={13} />}
            onClick={() => setCurrentPage((value) => value + 1)}
            size="sm"
            variant="primary"
          >
            Suivant
          </Button>
        </div>
      </div>

      <MobileDrawer onClose={() => setDrawerOpen(false)} open={drawerOpen}>
        <div className="modal__header">
          <a className="history-sidebar__brand" href="/upload">
            DataShare
          </a>
          <Button aria-label="Fermer le menu" icon={<X size={13} />} onClick={() => setDrawerOpen(false)} size="sm" variant="dark">
            Fermer
          </Button>
        </div>
        <nav className="history-sidebar__nav" aria-label="Navigation espace utilisateur">
          <a className="history-sidebar__item" href="/history">
            Mes fichiers
          </a>
        </nav>
      </MobileDrawer>

      <Modal onClose={() => setFilePendingDeletion(null)} open={Boolean(filePendingDeletion)} title="Supprimer le fichier">
        <div className="stack">
          <p>
            Supprimer {filePendingDeletion?.fileName} ? Cette action est irreversible et le lien public ne fonctionnera
            plus.
          </p>
          <div className="modal__actions">
            <Button onClick={() => setFilePendingDeletion(null)} size="sm" variant="secondary">
              Annuler
            </Button>
            <Button disabled={isLoading} onClick={() => void handleConfirmDelete()} size="sm" variant="danger">
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
