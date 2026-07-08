import { Upload } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface UploadCardProps {
  isLoading?: boolean;
  onUpload: (input: { file: File; password?: string; expiresInDays?: number; tags?: string }) => Promise<void>;
}

export function UploadCard({ isLoading = false, onUpload }: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [tags, setTags] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      return;
    }

    await onUpload({
      file,
      password: password || undefined,
      expiresInDays,
      tags: tags || undefined,
    });
  }

  return (
    <form className="upload-card" onSubmit={handleSubmit}>
      <label className="file-drop">
        <Upload size={28} />
        <span>{file ? file.name : 'Choose file'}</span>
        <input
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
        />
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
          label="Expires in days"
          min={1}
          max={30}
          name="expiresInDays"
          onChange={(event) => setExpiresInDays(Number(event.target.value))}
          type="number"
          value={expiresInDays}
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
