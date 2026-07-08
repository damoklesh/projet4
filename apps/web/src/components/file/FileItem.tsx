import { Trash2 } from 'lucide-react';
import type { FileAssetHistoryItem } from '../../features/file-assets/file-assets.types';
import { Button } from '../ui/Button';

interface FileItemProps {
  item: FileAssetHistoryItem;
  onDelete: (fileAssetId: string) => void;
}

export function FileItem({ item, onDelete }: FileItemProps) {
  return (
    <li className="file-item">
      <div>
        <strong>{item.originalName}</strong>
        <span>{item.status}</span>
      </div>
      <Button icon={<Trash2 size={16} />} onClick={() => onDelete(item.id)} variant="danger">
        Delete
      </Button>
    </li>
  );
}
