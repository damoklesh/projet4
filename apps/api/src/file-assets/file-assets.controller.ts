import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { join } from 'node:path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { FileAssetHistoryItemResponseDto } from './dto/file-asset-history-item.response';
import { FileAssetResponseDto } from './dto/file-asset.response';
import { FileAssetHistoryQueryDto } from './dto/file-asset-status-filter.dto';
import { UploadFileRequestDto } from './dto/upload-file.request';
import { FileAssetsService } from './file-assets.service';

@ApiTags('File assets')
@Controller()
export class FileAssetsController {
  constructor(private readonly fileAssetsService: FileAssetsService) {}

  @Post('file-assets')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { dest: join(process.cwd(), 'storage/tmp') }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        password: { type: 'string' },
        expiresInDays: { type: 'number' },
        tags: { type: 'string' },
      },
    },
  })
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadFileRequestDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<FileAssetResponseDto> {
    return this.fileAssetsService.create({
      file,
      ownerId: user?.id,
      dto,
    });
  }

  @Get('me/file-assets')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  history(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FileAssetHistoryQueryDto,
  ): Promise<{ items: FileAssetHistoryItemResponseDto[]; total: number; page: number; pageSize: number }> {
    return this.fileAssetsService.getHistory(user.id, query);
  }

  @Delete('file-assets/:fileAssetId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  delete(
    @Param('fileAssetId') fileAssetId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ deleted: true }> {
    return this.fileAssetsService.delete(fileAssetId, user.id);
  }
}
