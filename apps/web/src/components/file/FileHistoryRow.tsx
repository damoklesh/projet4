import { CloudDownload, Copy, FileText, Lock, Trash2 } from 'lucide-react';
import type { FileAssetHistoryItem } from '../../features/file-assets/file-assets.types';
import { Button } from '../ui/Button';
import { formatDate, formatFileSize, getExpirationLabel } from './file-format';

interface FileHistoryRowProps {
  item: FileAssetHistoryItem;
  onCopyShareLink: (url: string) => void;
  onDelete: (fileAssetId: string) => void;
}

export function FileHistoryRow({ item, onCopyShareLink, onDelete }: FileHistoryRowProps) {
  const isActionable = item.status === 'active' && item.shareLink.url.length > 0;

  return (
    <article className="history-row">
      <span className="file-row__icon">
        <FileText aria-hidden="true" size={15} />
      </span>
      <div className="history-row__content">
        <h2 className="history-row__title">{item.fileName}</h2>
        <p className="history-row__meta">
          {formatFileSize(item.size)} · Ajoute le {formatDate(item.uploadedAt)}
        </p>
      </div>
      <p className="history-row__meta">{item.status === 'expired' ? 'Expire' : getExpirationLabel(item.expiresAt)}</p>
      <div className="history-row__badges">
        {item.isPasswordProtected ? (
          <span className="badge">
            <Lock aria-hidden="true" size={10} />
            Protege
          </span>
        ) : null}
      </div>
      <div className="history-row__actions">
        {isActionable ? (
          <>
            <Button
              aria-label={`Copier le lien de ${item.fileName}`}
              icon={<Copy size={12} />}
              onClick={() => onCopyShareLink(item.shareLink.url)}
              size="sm"
              variant="primary"
            >
              Copier
            </Button>
            <Button
              aria-label={`Telecharger ${item.fileName}`}
              icon={<CloudDownload size={12} />}
              onClick={() => {
                window.location.assign(item.shareLink.url);
              }}
              size="sm"
              variant="primary"
            >
              Telecharger
            </Button>
            <Button
              aria-label={`Supprimer ${item.fileName}`}
              icon={<Trash2 size={12} />}
              onClick={() => onDelete(item.id)}
              size="sm"
              variant="danger"
            >
              Supprimer
            </Button>
          </>
        ) : (
          <p className="history-row__meta">Ce fichier a expire, il n'est plus stocke chez nous</p>
        )}
      </div>
    </article>
  );
}
