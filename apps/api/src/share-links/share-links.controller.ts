import { Body, Controller, Get, Param, Post, Res, StreamableFile } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { DownloadRequestDto } from './dto/download.request';
import { ShareLinkMetadataResponseDto } from './dto/share-link-metadata.response';
import { ShareLinksService } from './share-links.service';

@ApiTags('Share links')
@Controller('share-links')
export class ShareLinksController {
  constructor(private readonly shareLinksService: ShareLinksService) {}

  @Get(':token')
  getMetadata(@Param('token') token: string): Promise<ShareLinkMetadataResponseDto> {
    return this.shareLinksService.getMetadata(token);
  }

  @Post(':token/download')
  @ApiBody({ type: DownloadRequestDto, required: false })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({ description: 'Streams the file binary.' })
  async download(
    @Param('token') token: string,
    @Body() dto: DownloadRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.shareLinksService.download(token, dto);

    response.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    response.setHeader('Content-Length', String(file.size));
    response.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);

    return new StreamableFile(file.stream);
  }
}
