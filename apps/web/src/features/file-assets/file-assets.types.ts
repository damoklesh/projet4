import type { FileStatus, FileStatusFilter, PaginatedResult } from '@datashare/shared';

export type FileAssetSort = 'uploadedAt' | 'expiresAt' | 'fileName' | 'size';
export type SortOrder = 'asc' | 'desc';

export interface UploadFileInput {
  file: File;
  password?: string;
  expiresInDays?: number;
  tags?: string;
}

export interface FileAssetResponse {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  status: FileStatus;
  shareToken: string;
  expiresAt: string;
  ownerId?: string | null;
}

export interface FileAssetHistoryItem {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  expiresAt: string;
  status: FileStatus;
  downloadCount: number;
  tags: string[];
}

export interface FileAssetHistoryQuery {
  page?: number;
  pageSize?: number;
  status?: FileStatusFilter;
  tag?: string;
  sort?: FileAssetSort;
  order?: SortOrder;
}

export type FileAssetHistoryResult = PaginatedResult<FileAssetHistoryItem>;
