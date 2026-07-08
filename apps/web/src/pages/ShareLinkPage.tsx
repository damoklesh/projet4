import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { DownloadCard } from '../components/file/DownloadCard';
import { PublicPageLayout } from '../components/layout/PublicPageLayout';
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
      anchor.download = metadata?.fileName ?? 'telechargement';
      anchor.click();
      URL.revokeObjectURL(url);
      setDownloadMessage('Telechargement demarre.');
    } catch (err) {
      setError(getShareLinkErrorMessage(err));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <PublicPageLayout>
      {isLoading ? (
        <Spinner />
      ) : (
        <DownloadCard
          error={error}
          isDownloading={isDownloading}
          metadata={metadata}
          onDownload={handleDownload}
          password={password}
          setPassword={setPassword}
          successMessage={downloadMessage}
        />
      )}
    </PublicPageLayout>
  );
}

function getShareLinkErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404 || error.status === 410) {
      return "Ce fichier n'est plus disponible ou le lien a expire";
    }

    if (error.status === 401) {
      return 'Mot de passe incorrect';
    }
  }

  return error instanceof Error ? error.message : 'La demande de lien a echoue.';
}
