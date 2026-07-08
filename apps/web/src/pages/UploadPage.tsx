import { Callout } from '../components/ui/Callout';
import { UploadCard } from '../components/file/UploadCard';
import { ShareLinkCard } from '../components/file/ShareLinkCard';
import { useFileAssetsStore } from '../features/file-assets/file-assets.store';

export function UploadPage() {
  const upload = useFileAssetsStore((state) => state.upload);
  const error = useFileAssetsStore((state) => state.error);
  const isLoading = useFileAssetsStore((state) => state.isLoading);
  const lastUpload = useFileAssetsStore((state) => state.lastUpload);

  return (
    <section className="workspace">
      <div className="workspace__header">
        <h1>Upload</h1>
      </div>
      {error ? <Callout tone="danger">{error}</Callout> : null}
      <UploadCard isLoading={isLoading} onUpload={async (input) => void (await upload(input))} />
      {lastUpload ? <ShareLinkCard token={lastUpload.shareToken} /> : null}
    </section>
  );
}
