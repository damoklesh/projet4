import type { FileStatus, FileStatusFilter, PaginatedResult } from '@datashare/shared';

export type FileAssetSort = 'uploadedAt' | 'expiresAt' | 'fileName' | 'size';
export type SortOrder = 'asc' | 'desc';

export interface UploadFileInput {
  file: File;
  password?: string;
  expirationDays?: number;
  tags?: string;
}

export interface UploadedFileTag {
  id: string;
  name: string;
}

export interface UploadedFileAsset {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  expiresAt: string;
  status: FileStatus;
  isPasswordProtected: boolean;
  tags: UploadedFileTag[];
}

export interface UploadedShareLink {
  url: string;
  token: string;
  expiresAt: string;
  isPasswordProtected: boolean;
}

export interface FileAssetResponse {
  fileAsset: UploadedFileAsset;
  shareLink: UploadedShareLink;
}

export interface FileAssetHistoryItem {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  expiresAt: string;
  status: FileStatus;
  isPasswordProtected: boolean;
  tags: UploadedFileTag[];
  shareLink: UploadedShareLink;
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
