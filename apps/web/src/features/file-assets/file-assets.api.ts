import { httpClient } from '../../services/http-client';
import type {
  DeleteFileAssetResponse,
  FileAssetHistoryQuery,
  FileAssetHistoryResult,
  FileAssetResponse,
  UploadFileInput,
} from './file-assets.types';

export const fileAssetsApi = {
  upload(input: UploadFileInput): Promise<FileAssetResponse> {
    const formData = new FormData();
    formData.append('file', input.file);

    if (input.password) {
      formData.append('password', input.password);
    }

    if (input.expirationDays) {
      formData.append('expirationDays', String(input.expirationDays));
    }

    if (input.tags) {
      formData.append('tags', input.tags);
    }

    return httpClient<FileAssetResponse>('/file-assets', {
      method: 'POST',
      body: formData,
    });
  },

  history(query: FileAssetHistoryQuery = {}): Promise<FileAssetHistoryResult> {
    const searchParams = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value));
      }
    });

    const qs = searchParams.toString();
    return httpClient<FileAssetHistoryResult>(`/me/file-assets${qs ? `?${qs}` : ''}`);
  },

  delete(fileAssetId: string): Promise<DeleteFileAssetResponse> {
    return httpClient<DeleteFileAssetResponse>(`/file-assets/${fileAssetId}`, {
      method: 'DELETE',
    });
  },
};
