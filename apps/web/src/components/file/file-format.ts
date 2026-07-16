export function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} o`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} Ko`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR');
}

export function getExpirationLabel(expiresAt: string): string {
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  const diffDays = Math.ceil((end - now) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) {
    return 'Ce fichier a expire';
  }

  if (diffDays === 1) {
    return 'Ce fichier expire demain';
  }

  return `Ce fichier expire dans ${diffDays} jours`;
}

export function getRetentionLabel(expiresAt: string): string {
  const end = new Date(expiresAt).getTime();
  const now = Date.now();
  const diffDays = Math.max(1, Math.ceil((end - now) / (24 * 60 * 60 * 1000)));

  if (diffDays === 1) {
    return 'Felicitations, ton fichier sera conserve chez nous pendant une journee !';
  }

  if (diffDays === 7) {
    return 'Felicitations, ton fichier sera conserve chez nous pendant une semaine !';
  }

  return `Felicitations, ton fichier sera conserve chez nous pendant ${diffDays} jours !`;
}
