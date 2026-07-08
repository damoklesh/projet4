import { Upload } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Callout } from '../ui/Callout';
import { Input } from '../ui/Input';

interface UploadCardProps {
  isLoading?: boolean;
  onUpload: (input: { file: File; password?: string; expirationDays?: number; tags?: string }) => Promise<void>;
}

const MAX_UPLOAD_SIZE_BYTES = 1_073_741_824;
const FORBIDDEN_EXTENSIONS = ['.bat', '.cmd', '.com', '.dll', '.exe', '.msi', '.scr', '.sh'];

export function UploadCard({ isLoading = false, onUpload }: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [tags, setTags] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validateUploadForm({ file, password, expirationDays, tags });
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);

    await onUpload({
      file: file as File,
      password: password || undefined,
      expirationDays,
      tags: tags || undefined,
    });
  }

  return (
    <form className="upload-card" noValidate onSubmit={handleSubmit}>
      {validationError ? <Callout tone="danger">{validationError}</Callout> : null}
      <label className="file-drop">
        <Upload size={28} />
        <span>{file ? file.name : 'Choose file'}</span>
        <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />
      </label>
      <div className="grid grid--two">
        <Input
          label="Password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Optional"
          type="password"
          value={password}
        />
        <Input
          label="Expiration in days"
          min={1}
          max={7}
          name="expirationDays"
          onChange={(event) => setExpirationDays(Number(event.target.value))}
          type="number"
          value={expirationDays}
        />
      </div>
      <Input
        label="Tags"
        name="tags"
        onChange={(event) => setTags(event.target.value)}
        placeholder="Optional"
        value={tags}
      />
      <Button disabled={!file || isLoading} icon={<Upload size={16} />} type="submit">
        Upload
      </Button>
    </form>
  );
}

function validateUploadForm(input: {
  file: File | null;
  password: string;
  expirationDays: number;
  tags: string;
}): string | null {
  if (!input.file) {
    return 'Please select a file.';
  }

  if (input.file.size > MAX_UPLOAD_SIZE_BYTES) {
    return 'File size must not exceed 1 GB.';
  }

  if (FORBIDDEN_EXTENSIONS.some((extension) => input.file?.name.toLowerCase().endsWith(extension))) {
    return 'This file type is not allowed.';
  }

  if (input.password && input.password.length < 6) {
    return 'Password must contain at least 6 characters.';
  }

  if (!Number.isInteger(input.expirationDays) || input.expirationDays < 1 || input.expirationDays > 7) {
    return 'Expiration must be between 1 and 7 days.';
  }

  const tagNames = input.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (tagNames.some((tag) => tag.length > 30)) {
    return 'Tag names must not exceed 30 characters.';
  }

  return null;
}
