import { Trash2 } from 'lucide-react';
import type { FileAssetHistoryItem } from '../../features/file-assets/file-assets.types';
import { Button } from '../ui/Button';

interface FileHistoryTableProps {
  items: FileAssetHistoryItem[];
  onDelete: (fileAssetId: string) => void;
}

export function FileHistoryTable({ items, onDelete }: FileHistoryTableProps) {
  return (
    <div className="table-shell">
      <table className="history-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Status</th>
            <th>Size</th>
            <th>Expires</th>
            <th>Downloads</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.originalName}</td>
              <td>{item.status}</td>
              <td>{formatBytes(item.size)}</td>
              <td>{new Date(item.expiresAt).toLocaleDateString()}</td>
              <td>{item.downloadCount}</td>
              <td>
                <Button icon={<Trash2 size={16} />} onClick={() => onDelete(item.id)} variant="danger">
                  Delete
                </Button>
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
