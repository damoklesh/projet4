import type { FileStatus } from '@datashare/shared';

export interface ShareLinkMetadata {
  token: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  expiresAt: string;
  passwordProtected: boolean;
  status: FileStatus;
}

export interface DownloadShareLinkInput {
  token: string;
  password?: string;
}
