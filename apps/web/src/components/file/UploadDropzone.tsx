import { CloudUpload } from 'lucide-react';
import { useRef } from 'react';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
}

export function UploadDropzone({ onFileSelected }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="upload-empty">
      <p className="upload-empty__title">Tu veux partager un fichier ?</p>
      <button
        aria-label="Choisir un fichier"
        className="upload-dropzone"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <span className="upload-dropzone__inner">
          <CloudUpload aria-hidden="true" size={22} />
        </span>
      </button>
      <input
        ref={inputRef}
        aria-label="Choose file"
        className="visually-hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelected(file);
          }
        }}
        type="file"
      />
    </div>
  );
}
