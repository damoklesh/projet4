import { useState } from 'react';
import { UploadDropzone } from './UploadDropzone';
import { UploadFormCard } from './UploadFormCard';

interface UploadCardProps {
  isLoading?: boolean;
  onUpload: (input: { file: File; password?: string; expirationDays?: number; tags?: string }) => Promise<void>;
}

export function UploadCard({ isLoading = false, onUpload }: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);

  if (!file) {
    return <UploadDropzone onFileSelected={setFile} />;
  }

  return <UploadFormCard file={file} isLoading={isLoading} onChangeFile={setFile} onUpload={onUpload} />;
}
