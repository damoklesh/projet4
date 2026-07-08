import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FileHistoryTable } from '../components/file/FileHistoryTable';
import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { useFileAssetsStore } from '../features/file-assets/file-assets.store';
import type { FileAssetHistoryItem, FileAssetSort, SortOrder } from '../features/file-assets/file-assets.types';
import type { FileStatusFilter } from '@datashare/shared';

export function HistoryPage() {
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
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState<FileAssetSort>('uploadedAt');
  const [order, setOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(10);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [filePendingDeletion, setFilePendingDeletion] = useState<FileAssetHistoryItem | null>(null);

  useEffect(() => {
    void loadHistory({
      page: currentPage,
      pageSize: currentPageSize,
      status,
      tag: tag.trim() || undefined,
      sort,
      order,
    });
  }, [currentPage, currentPageSize, loadHistory, order, sort, status, tag]);

  function resetToFirstPage() {
    setCurrentPage(1);
  }

  async function handleCopyShareLink(url: string) {
    await navigator.clipboard.writeText(url);
    setCopyMessage('Share link copied.');
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

  return (
    <section className="workspace">
      <div className="workspace__header">
        <h1>History</h1>
        <Button
          icon={<RefreshCw size={16} />}
          onClick={() =>
            void loadHistory({
              page: currentPage,
              pageSize: currentPageSize,
              status,
              tag: tag.trim() || undefined,
              sort,
              order,
            })
          }
          variant="secondary"
        >
          Refresh
        </Button>
      </div>
      {error ? <Callout tone="danger">{error}</Callout> : null}
      {copyMessage ? <Callout tone="success">{copyMessage}</Callout> : null}
      <div className="toolbar">
        <Select
          label="Status"
          name="status"
          onChange={(event) => {
            setStatus(event.target.value as FileStatusFilter);
            resetToFirstPage();
          }}
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Expired', value: 'expired' },
            { label: 'All', value: 'all' },
          ]}
          value={status}
        />
        <Input
          label="Tag"
          maxLength={30}
          name="tag"
          onChange={(event) => {
            setTag(event.target.value);
            resetToFirstPage();
          }}
          placeholder="facture"
          value={tag}
        />
        <Select
          label="Sort"
          name="sort"
          onChange={(event) => {
            setSort(event.target.value as FileAssetSort);
            resetToFirstPage();
          }}
          options={[
            { label: 'Uploaded', value: 'uploadedAt' },
            { label: 'Expires', value: 'expiresAt' },
            { label: 'Name', value: 'fileName' },
            { label: 'Size', value: 'size' },
          ]}
          value={sort}
        />
        <Select
          label="Order"
          name="order"
          onChange={(event) => {
            setOrder(event.target.value as SortOrder);
            resetToFirstPage();
          }}
          options={[
            { label: 'Descending', value: 'desc' },
            { label: 'Ascending', value: 'asc' },
          ]}
          value={order}
        />
        <Select
          label="Page size"
          name="pageSize"
          onChange={(event) => {
            setCurrentPageSize(Number(event.target.value));
            resetToFirstPage();
          }}
          options={[
            { label: '10', value: '10' },
            { label: '25', value: '25' },
            { label: '50', value: '50' },
            { label: '100', value: '100' },
          ]}
          value={String(currentPageSize)}
        />
      </div>
      <FileHistoryTable
        items={history}
        onCopyShareLink={(url) => void handleCopyShareLink(url)}
        onDelete={(fileAssetId) => {
          setFilePendingDeletion(history.find((item) => item.id === fileAssetId) ?? null);
        }}
      />
      <div className="pagination-bar">
        <p className="muted">
          {isLoading
            ? 'Loading...'
            : `${totalItems} files, page ${page} of ${Math.max(totalPages, 1)}, ${pageSize} per page`}
        </p>
        <div className="pagination-actions">
          <Button
            disabled={currentPage <= 1 || isLoading}
            icon={<ChevronLeft size={16} />}
            onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
            variant="secondary"
          >
            Previous
          </Button>
          <Button
            disabled={currentPage >= totalPages || totalPages === 0 || isLoading}
            icon={<ChevronRight size={16} />}
            onClick={() => setCurrentPage((value) => value + 1)}
            variant="secondary"
          >
            Next
          </Button>
        </div>
      </div>
      <Modal
        onClose={() => setFilePendingDeletion(null)}
        open={Boolean(filePendingDeletion)}
        title="Delete file"
      >
        <div className="stack">
          <p>
            Delete {filePendingDeletion?.fileName}? This action is irreversible and the public share link will stop
            working.
          </p>
          <div className="modal__actions">
            <Button onClick={() => setFilePendingDeletion(null)} variant="secondary">
              Cancel
            </Button>
            <Button disabled={isLoading} onClick={() => void handleConfirmDelete()} variant="danger">
              Delete permanently
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
