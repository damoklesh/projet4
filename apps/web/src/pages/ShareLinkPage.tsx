import { Download } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { shareLinksApi } from '../features/share-links/share-links.api';
import type { ShareLinkMetadata } from '../features/share-links/share-links.types';
import { ApiError } from '../services/api-error';

export function ShareLinkPage() {
  const { token = '' } = useParams();
  const [metadata, setMetadata] = useState<ShareLinkMetadata | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [downloadMessage, setDownloadMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setError(null);
    setMetadata(null);
    setIsLoading(true);

    shareLinksApi
      .metadata(token)
      .then(setMetadata)
      .catch((err: unknown) => setError(getShareLinkErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [token]);

  async function handleDownload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDownloadMessage(null);
    setIsDownloading(true);

    try {
      const blob = await shareLinksApi.download({ token, password: password || undefined });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = metadata?.fileName ?? 'download';
      anchor.click();
      URL.revokeObjectURL(url);
      setDownloadMessage('Download started.');
    } catch (err) {
      setError(getShareLinkErrorMessage(err));
    } finally {
      setIsDownloading(false);
    }
  }

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <section className="panel">
      {error ? <Callout tone="danger">{error}</Callout> : null}
      {downloadMessage ? <Callout tone="success">{downloadMessage}</Callout> : null}
      {metadata ? (
        <>
          <h1>{metadata.fileName}</h1>
          <dl className="metadata-list">
            <div>
              <dt>Status</dt>
              <dd>{metadata.status}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{metadata.mimeType}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{formatFileSize(metadata.size)}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>{new Date(metadata.expiresAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Protection</dt>
              <dd>{metadata.isPasswordProtected ? 'Password required' : 'No password'}</dd>
            </div>
          </dl>
          <form className="stack" onSubmit={handleDownload}>
            {metadata.isPasswordProtected ? (
              <Input
                label="Password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            ) : null}
            <Button
              disabled={metadata.status !== 'active' || isDownloading}
              icon={<Download size={16} />}
              type="submit"
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </form>
        </>
      ) : null}
    </section>
  );
}

function getShareLinkErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return 'This share link does not exist.';
    }

    if (error.status === 410) {
      return error.message || 'This share link is no longer available.';
    }

    if (error.status === 401) {
      return 'A valid password is required.';
    }
  }

  return error instanceof Error ? error.message : 'Share link request failed.';
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
