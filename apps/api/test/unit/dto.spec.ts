import { AuthResponseDto } from '../../src/auth/dto/auth.response';
import { DeleteFileAssetResponseDto } from '../../src/file-assets/dto/delete-file-asset.response';
import {
  FileAssetResponseDto,
  UploadedFileAssetResponseDto,
  UploadedFileTagResponseDto,
  UploadedShareLinkResponseDto,
} from '../../src/file-assets/dto/file-asset.response';
import {
  FileAssetHistoryItemResponseDto,
  FileAssetHistoryPaginationResponseDto,
  FileAssetHistoryResponseDto,
} from '../../src/file-assets/dto/file-asset-history-item.response';
import { ShareLinkMetadataResponseDto } from '../../src/share-links/dto/share-link-metadata.response';
import { ShareLinkResponseDto } from '../../src/share-links/dto/share-link.response';
import { TagResponseDto } from '../../src/tags/dto/tag.response';
import { UserPublicDto } from '../../src/users/dto/user-public.dto';

describe('response DTOs', () => {
  it('can represent auth responses without password fields', () => {
    const dto = Object.assign(new AuthResponseDto(), {
      accessToken: 'token',
      tokenType: 'Bearer' as const,
      expiresIn: 3600,
      user: Object.assign(new UserPublicDto(), {
        id: 'user-id',
        email: 'user@example.com',
        avatar: null,
      }),
    });

    expect(dto).toEqual({
      accessToken: 'token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 'user-id',
        email: 'user@example.com',
        avatar: null,
      },
    });
    expect(JSON.stringify(dto)).not.toContain('password');
  });

  it('can represent upload and history file responses', () => {
    const uploadedAt = new Date('2026-07-08T10:30:00.000Z');
    const expiresAt = new Date('2026-07-09T10:30:00.000Z');
    const tag = Object.assign(new UploadedFileTagResponseDto(), {
      id: 'tag-id',
      name: 'facture',
    });
    const shareLink = Object.assign(new UploadedShareLinkResponseDto(), {
      url: 'http://localhost:5173/share/token',
      token: 'token',
      expiresAt,
      isPasswordProtected: true,
    });
    const fileAsset = Object.assign(new UploadedFileAssetResponseDto(), {
      id: 'file-id',
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
      size: 12,
      uploadedAt,
      expiresAt,
      status: 'active' as const,
      isPasswordProtected: true,
      tags: [tag],
    });

    expect(
      Object.assign(new FileAssetResponseDto(), {
        fileAsset,
        shareLink,
      }),
    ).toMatchObject({
      fileAsset: {
        id: 'file-id',
        tags: [{ name: 'facture' }],
      },
      shareLink: {
        token: 'token',
      },
    });

    expect(
      Object.assign(new FileAssetHistoryResponseDto(), {
        items: [
          Object.assign(new FileAssetHistoryItemResponseDto(), {
            ...fileAsset,
            shareLink,
          }),
        ],
        pagination: Object.assign(new FileAssetHistoryPaginationResponseDto(), {
          page: 1,
          pageSize: 10,
          totalItems: 1,
          totalPages: 1,
        }),
      }),
    ).toMatchObject({
      items: [{ id: 'file-id' }],
      pagination: { totalItems: 1 },
    });
  });

  it('can represent share link metadata, delete, tags and public users', () => {
    const expiresAt = new Date('2026-07-09T10:30:00.000Z');
    const uploadedAt = new Date('2026-07-08T10:30:00.000Z');

    expect(
      Object.assign(new ShareLinkMetadataResponseDto(), {
        token: 'token',
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 12,
        uploadedAt,
        expiresAt,
        isPasswordProtected: false,
        status: 'active' as const,
      }),
    ).toMatchObject({
      token: 'token',
      status: 'active',
    });

    expect(
      Object.assign(new ShareLinkResponseDto(), {
        id: 'share-id',
        token: 'token',
        fileAssetId: 'file-id',
        expiresAt,
        downloadCount: 0,
        passwordProtected: false,
      }),
    ).toMatchObject({
      id: 'share-id',
      passwordProtected: false,
    });

    expect(Object.assign(new DeleteFileAssetResponseDto(), { id: 'file-id', status: 'deleted' })).toEqual({
      id: 'file-id',
      status: 'deleted',
    });
    expect(Object.assign(new TagResponseDto(), { id: 'tag-id', name: 'facture', createdAt: uploadedAt })).toEqual({
      id: 'tag-id',
      name: 'facture',
      createdAt: uploadedAt,
    });
  });
});
