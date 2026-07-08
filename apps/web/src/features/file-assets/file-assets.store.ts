import { create } from 'zustand';
import { fileAssetsApi } from './file-assets.api';
import type {
  FileAssetHistoryItem,
  FileAssetHistoryQuery,
  FileAssetResponse,
  UploadFileInput,
} from './file-assets.types';

interface FileAssetsState {
  history: FileAssetHistoryItem[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
  lastUpload: FileAssetResponse | null;
  isLoading: boolean;
  error: string | null;
  upload: (input: UploadFileInput) => Promise<FileAssetResponse>;
  loadHistory: (query?: FileAssetHistoryQuery) => Promise<void>;
  deleteFile: (fileAssetId: string) => Promise<void>;
  clearLastUpload: () => void;
}

export const useFileAssetsStore = create<FileAssetsState>((set) => ({
  history: [],
  totalItems: 0,
  totalPages: 0,
  page: 1,
  pageSize: 10,
  lastUpload: null,
  isLoading: false,
  error: null,

  upload: async (input) => {
    set({ isLoading: true, error: null });

    try {
      const uploaded = await fileAssetsApi.upload(input);
      set({ lastUpload: uploaded, isLoading: false });
      return uploaded;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Upload failed', isLoading: false });
      throw error;
    }
  },

  loadHistory: async (query = {}) => {
    set({ isLoading: true, error: null });

    try {
      const result = await fileAssetsApi.history(query);
      set({
        history: result.items,
        totalItems: result.pagination.totalItems,
        totalPages: result.pagination.totalPages,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'History loading failed', isLoading: false });
      throw error;
    }
  },

  deleteFile: async (fileAssetId) => {
    await fileAssetsApi.delete(fileAssetId);
    set((state) => ({
      history: state.history.filter((item) => item.id !== fileAssetId),
      totalItems: Math.max(0, state.totalItems - 1),
    }));
  },

  clearLastUpload: () => set({ lastUpload: null }),
}));

export const fileAssetSelectors = {
  history: (state: FileAssetsState) => state.history,
  lastUpload: (state: FileAssetsState) => state.lastUpload,
  isLoading: (state: FileAssetsState) => state.isLoading,
};
