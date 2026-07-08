import { Copy, Trash2 } from 'lucide-react';
import type { FileAssetHistoryItem } from '../../features/file-assets/file-assets.types';
import { Button } from '../ui/Button';

interface FileHistoryTableProps {
  items: FileAssetHistoryItem[];
  onCopyShareLink: (url: string) => void;
  onDelete: (fileAssetId: string) => void;
}

export function FileHistoryTable({ items, onCopyShareLink, onDelete }: FileHistoryTableProps) {
  if (items.length === 0) {
    return <p className="muted">No files match these filters.</p>;
  }

  return (
    <div className="table-shell">
      <table className="history-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Status</th>
            <th>Size</th>
            <th>Uploaded</th>
            <th>Expires</th>
            <th>Tags</th>
            <th>Protected</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.fileName}</td>
              <td>{item.status}</td>
              <td>{formatBytes(item.size)}</td>
              <td>{new Date(item.uploadedAt).toLocaleDateString()}</td>
              <td>{new Date(item.expiresAt).toLocaleDateString()}</td>
              <td>{item.tags.length > 0 ? item.tags.map((tag) => tag.name).join(', ') : '-'}</td>
              <td>{item.isPasswordProtected ? 'Yes' : 'No'}</td>
              <td>
                <div className="table-actions">
                  <Button icon={<Copy size={16} />} onClick={() => onCopyShareLink(item.shareLink.url)} variant="secondary">
                    Copy link
                  </Button>
                  <Button icon={<Trash2 size={16} />} onClick={() => onDelete(item.id)} variant="danger">
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const unit = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(unit)), sizes.length - 1);

  return `${(bytes / unit ** index).toFixed(1)} ${sizes[index]}`;
}
