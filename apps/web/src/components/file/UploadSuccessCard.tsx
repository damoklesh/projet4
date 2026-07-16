import { CloudUpload, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { FileAssetResponse } from '../../features/file-assets/file-assets.types';
import { FilePreviewRow } from './FilePreviewRow';
import { getRetentionLabel } from './file-format';

interface UploadSuccessCardProps {
  onCopy: () => void;
  onNewUpload: () => void;
  upload: FileAssetResponse;
}

export function UploadSuccessCard({ onCopy, onNewUpload, upload }: UploadSuccessCardProps) {
  return (
    <Card title="Ajouter un fichier" variant="bottomSheet">
      <FilePreviewRow fileName={upload.fileAsset.fileName} size={upload.fileAsset.size} />
      <p className="upload-success__message">
        {getRetentionLabel(upload.shareLink.expiresAt)}
      </p>
      <div className="copy-row">
        <input aria-label="Lien de partage" className="input" readOnly value={upload.shareLink.url} />
        <Button icon={<Copy size={13} />} onClick={onCopy} size="sm" variant="primary">
          Copier le lien
        </Button>
      </div>
      <Button icon={<CloudUpload size={13} />} onClick={onNewUpload} size="sm" variant="primary">
        Televerser
      </Button>
    </Card>
  );
}
