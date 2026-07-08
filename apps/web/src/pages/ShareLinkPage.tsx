import { Download } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Callout } from '../components/ui/Callout';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { shareLinksApi } from '../features/share-links/share-links.api';
import type { ShareLinkMetadata } from '../features/share-links/share-links.types';

export function ShareLinkPage() {
  const { token = '' } = useParams();
  const [metadata, setMetadata] = useState<ShareLinkMetadata | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    shareLinksApi
      .metadata(token)
      .then(setMetadata)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Share link loading failed'))
      .finally(() => setIsLoading(false));
  }, [token]);

  async function handleDownload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const blob = await shareLinksApi.download({ token, password: password || undefined });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = metadata?.fileName ?? 'download';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <section className="panel">
      {error ? <Callout tone="danger">{error}</Callout> : null}
      {metadata ? (
        <>
          <h1>{metadata.fileName}</h1>
          <dl className="metadata-list">
            <div>
              <dt>Status</dt>
              <dd>{metadata.status}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>{new Date(metadata.expiresAt).toLocaleString()}</dd>
            </div>
          </dl>
          <form className="stack" onSubmit={handleDownload}>
            {metadata.passwordProtected ? (
              <Input
                label="Password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            ) : null}
            <Button disabled={metadata.status !== 'active'} icon={<Download size={16} />} type="submit">
              Download
            </Button>
          </form>
        </>
      ) : null}
    </section>
  );
}
