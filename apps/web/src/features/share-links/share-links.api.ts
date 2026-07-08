import { httpClient } from '../../services/http-client';
import type { DownloadShareLinkInput, ShareLinkMetadata } from './share-links.types';

export const shareLinksApi = {
  metadata(token: string): Promise<ShareLinkMetadata> {
    return httpClient<ShareLinkMetadata>(`/share-links/${token}`);
  },

  download(input: DownloadShareLinkInput): Promise<Blob> {
    return httpClient<Blob>(`/share-links/${input.token}/download`, {
      method: 'POST',
      body: JSON.stringify({ password: input.password }),
    });
  },
};
