import { FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatFileSize } from './file-format';

interface FilePreviewRowProps {
  fileName: string;
  size: number;
  onChange?: () => void;
}

export function FilePreviewRow({ fileName, onChange, size }: FilePreviewRowProps) {
  return (
    <div className="file-row">
      <span className="file-row__icon">
        <FileText aria-hidden="true" size={15} />
      </span>
      <span>
        <span className="file-row__name">{fileName}</span>
        <span className="file-row__meta">{formatFileSize(size)}</span>
      </span>
      {onChange ? (
        <Button onClick={onChange} size="sm" variant="primary">
          Changer
        </Button>
      ) : null}
    </div>
  );
}
