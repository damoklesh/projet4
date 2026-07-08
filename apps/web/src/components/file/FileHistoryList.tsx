import type { FileAssetHistoryItem } from '../../features/file-assets/file-assets.types';
import { FileHistoryRow } from './FileHistoryRow';

interface FileHistoryListProps {
  items: FileAssetHistoryItem[];
  onCopyShareLink: (url: string) => void;
  onDelete: (fileAssetId: string) => void;
}

export function FileHistoryList({ items, onCopyShareLink, onDelete }: FileHistoryListProps) {
  if (items.length === 0) {
    return <p className="muted">Aucun fichier ne correspond a ce filtre.</p>;
  }

  return (
    <div className="history-list">
      {items.map((item) => (
        <FileHistoryRow item={item} key={item.id} onCopyShareLink={onCopyShareLink} onDelete={onDelete} />
      ))}
    </div>
  );
}
