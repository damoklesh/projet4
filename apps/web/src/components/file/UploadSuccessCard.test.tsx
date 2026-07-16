import { render, screen } from '@testing-library/react';
import { UploadSuccessCard } from './UploadSuccessCard';
import type { FileAssetResponse } from '../../features/file-assets/file-assets.types';

describe('UploadSuccessCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-16T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['2026-07-17T10:00:00.000Z', /une journee/i],
    ['2026-07-19T10:00:00.000Z', /3 jours/i],
    ['2026-07-23T10:00:00.000Z', /une semaine/i],
  ])('displays the real retention duration for %s', (expiresAt, expectedText) => {
    render(
      <UploadSuccessCard
        onCopy={vi.fn()}
        onNewUpload={vi.fn()}
        upload={createUploadResponse(expiresAt)}
      />,
    );

    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });
});

function createUploadResponse(expiresAt: string): FileAssetResponse {
  return {
    fileAsset: {
      id: 'file-id',
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
      size: 12,
      uploadedAt: '2026-07-16T10:00:00.000Z',
      expiresAt,
      status: 'active',
      isPasswordProtected: false,
      tags: [],
    },
    shareLink: {
      url: 'http://localhost:5173/share/token',
      token: 'token',
      expiresAt,
      isPasswordProtected: false,
    },
  };
}
