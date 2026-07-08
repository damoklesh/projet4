import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FileHistoryTable } from '../components/file/FileHistoryTable';
import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
import { Select } from '../components/ui/Select';
import { useFileAssetsStore } from '../features/file-assets/file-assets.store';
import type { FileAssetSort, SortOrder } from '../features/file-assets/file-assets.types';
import type { FileStatusFilter } from '@datashare/shared';

export function HistoryPage() {
  const { deleteFile, error, history, isLoading, loadHistory, page, pageSize, total } = useFileAssetsStore(
    (state) => ({
      deleteFile: state.deleteFile,
      error: state.error,
      history: state.history,
      isLoading: state.isLoading,
      loadHistory: state.loadHistory,
      page: state.page,
      pageSize: state.pageSize,
      total: state.total,
    }),
  );
  const [status, setStatus] = useState<FileStatusFilter>('all');
  const [sort, setSort] = useState<FileAssetSort>('uploadedAt');
  const [order, setOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    void loadHistory({ status, sort, order });
  }, [loadHistory, order, sort, status]);

  return (
    <section className="workspace">
      <div className="workspace__header">
        <h1>History</h1>
        <Button icon={<RefreshCw size={16} />} onClick={() => void loadHistory({ status, sort, order })} variant="secondary">
          Refresh
        </Button>
      </div>
      {error ? <Callout tone="danger">{error}</Callout> : null}
      <div className="toolbar">
        <Select
          label="Status"
          name="status"
          onChange={(event) => setStatus(event.target.value as FileStatusFilter)}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Expired', value: 'expired' },
          ]}
          value={status}
        />
        <Select
          label="Sort"
          name="sort"
          onChange={(event) => setSort(event.target.value as FileAssetSort)}
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
          onChange={(event) => setOrder(event.target.value as SortOrder)}
          options={[
            { label: 'Descending', value: 'desc' },
            { label: 'Ascending', value: 'asc' },
          ]}
          value={order}
        />
      </div>
      <FileHistoryTable items={history} onDelete={(fileAssetId) => void deleteFile(fileAssetId)} />
      <p className="muted">
        {isLoading ? 'Loading...' : `${total} files, page ${page}, ${pageSize} per page`}
      </p>
    </section>
  );
}
