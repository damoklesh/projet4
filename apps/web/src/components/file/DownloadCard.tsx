import { CloudDownload } from 'lucide-react';
import type { FormEvent } from 'react';
import type { ShareLinkMetadata } from '../../features/share-links/share-links.types';
import { Button } from '../ui/Button';
import { Callout } from '../ui/Callout';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { FilePreviewRow } from './FilePreviewRow';
import { getExpirationLabel } from './file-format';

interface DownloadCardProps {
  error?: string | null;
  isDownloading?: boolean;
  metadata: ShareLinkMetadata | null;
  onDownload: (event: FormEvent<HTMLFormElement>) => void;
  password: string;
  setPassword: (password: string) => void;
  successMessage?: string | null;
}

export function DownloadCard({
  error,
  isDownloading = false,
  metadata,
  onDownload,
  password,
  setPassword,
  successMessage,
}: DownloadCardProps) {
  const hasMetadata = Boolean(metadata);
  const isUnavailable = metadata?.status && metadata.status !== 'active';
  const passwordRequired = Boolean(metadata?.isPasswordProtected);

  return (
    <Card className="download-file-card" title="Telecharger un fichier">
      {error ? <Callout tone="danger">{error}</Callout> : null}
      {successMessage ? <Callout tone="success">{successMessage}</Callout> : null}
      {metadata ? (
        <>
          <FilePreviewRow fileName={metadata.fileName} size={metadata.size} />
          {isUnavailable ? (
            <Callout tone="danger">Ce fichier n'est plus disponible ou le lien a expire</Callout>
          ) : (
            <Callout tone="info">{getExpirationLabel(metadata.expiresAt)}</Callout>
          )}
          <form className="stack" onSubmit={onDownload}>
            {passwordRequired ? (
              <Input
                label="Mot de passe"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Saisissez le mot de passe..."
                type="password"
                value={password}
              />
            ) : null}
            <Button
              disabled={Boolean(isUnavailable) || isDownloading || (passwordRequired && !password)}
              icon={<CloudDownload size={13} />}
              size="sm"
              type="submit"
              variant="primary"
            >
              {isDownloading ? 'Telechargement...' : 'Telecharger'}
            </Button>
          </form>
        </>
      ) : !hasMetadata && !error ? null : null}
    </Card>
  );
}
