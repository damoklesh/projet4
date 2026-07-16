import { CloudUpload } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Callout } from '../ui/Callout';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { FilePreviewRow } from './FilePreviewRow';

interface UploadFormCardProps {
  file: File;
  isLoading?: boolean;
  onChangeFile: (file: File) => void;
  onUpload: (input: { file: File; password?: string; expirationDays?: number; tags?: string }) => Promise<void>;
}

const MAX_UPLOAD_SIZE_BYTES = 1_073_741_824;
const FORBIDDEN_EXTENSIONS = ['.bat', '.cmd', '.com', '.dll', '.exe', '.msi', '.scr', '.sh'];

export function UploadFormCard({ file, isLoading = false, onChangeFile, onUpload }: UploadFormCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [password, setPassword] = useState('');
  const [expirationDays, setExpirationDays] = useState(7);
  const [validationError, setValidationError] = useState<string | null>(validateSelectedFile(file));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validateUploadForm({ file, password, expirationDays });
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    await onUpload({
      file,
      password: password || undefined,
      expirationDays,
    });
  }

  function handleChangeFile(nextFile: File) {
    onChangeFile(nextFile);
    setValidationError(validateSelectedFile(nextFile));
  }

  const isSubmitDisabled = Boolean(validateSelectedFile(file)) || isLoading;

  return (
    <Card title="Ajouter un fichier" variant="bottomSheet">
      <form className="stack" noValidate onSubmit={handleSubmit}>
        <FilePreviewRow fileName={file.name} onChange={() => fileInputRef.current?.click()} size={file.size} />
        <input
          ref={fileInputRef}
          className="visually-hidden"
          onChange={(event) => {
            const nextFile = event.target.files?.[0];
            if (nextFile) {
              handleChangeFile(nextFile);
            }
          }}
          type="file"
        />
        {validationError ? <Callout tone="danger">{validationError}</Callout> : null}
        <Input
          label="Mot de passe"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Optionnel"
          type="password"
          value={password}
        />
        <Select
          label="Expiration"
          name="expirationDays"
          onChange={(event) => setExpirationDays(Number(event.target.value))}
          options={[
            { label: 'Une journee', value: '1' },
            { label: '3 jours', value: '3' },
            { label: '7 jours', value: '7' },
          ]}
          value={String(expirationDays)}
        />
        <Button disabled={isSubmitDisabled} icon={<CloudUpload size={13} />} size="sm" type="submit" variant="primary">
          {isLoading ? 'Televersement...' : 'Televerser'}
        </Button>
      </form>
    </Card>
  );
}

function validateSelectedFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return 'La taille des fichiers est limitee a 1 Go';
  }

  if (FORBIDDEN_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension))) {
    return "Ce type de fichier n'est pas autorise.";
  }

  return null;
}

function validateUploadForm(input: { file: File; password: string; expirationDays: number }): string | null {
  const fileError = validateSelectedFile(input.file);
  if (fileError) {
    return fileError;
  }

  if (input.password && input.password.length < 6) {
    return 'Le mot de passe doit contenir au moins 6 caracteres.';
  }

  if (!Number.isInteger(input.expirationDays) || input.expirationDays < 1 || input.expirationDays > 7) {
    return "La duree d'expiration doit etre comprise entre 1 et 7 jours.";
  }

  return null;
}
