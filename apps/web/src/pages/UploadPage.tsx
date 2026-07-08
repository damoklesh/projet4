import { Callout } from '../components/ui/Callout';
import { UploadCard } from '../components/file/UploadCard';
import { UploadSuccessCard } from '../components/file/UploadSuccessCard';
import { PublicPageLayout } from '../components/layout/PublicPageLayout';
import { useFileAssetsStore } from '../features/file-assets/file-assets.store';
import { useState } from 'react';

export function UploadPage() {
  const upload = useFileAssetsStore((state) => state.upload);
  const clearLastUpload = useFileAssetsStore((state) => state.clearLastUpload);
  const error = useFileAssetsStore((state) => state.error);
  const isLoading = useFileAssetsStore((state) => state.isLoading);
  const lastUpload = useFileAssetsStore((state) => state.lastUpload);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  return (
    <PublicPageLayout align={lastUpload ? 'bottom' : 'center'}>
      {error ? <Callout tone="danger">{error}</Callout> : null}
      {copyMessage ? <Callout tone="success">{copyMessage}</Callout> : null}
      {lastUpload ? (
        <UploadSuccessCard
          onCopy={() => {
            void navigator.clipboard.writeText(lastUpload.shareLink.url);
            setCopyMessage('Lien copie.');
          }}
          onNewUpload={() => {
            setCopyMessage(null);
            clearLastUpload();
          }}
          upload={lastUpload}
        />
      ) : (
        <UploadCard isLoading={isLoading} onUpload={async (input) => void (await upload(input))} />
      )}
    </PublicPageLayout>
  );
}
