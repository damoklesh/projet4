import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { ApiResponse } from '../common/types/api-response.type';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { DeleteFileAssetResponseDto } from './dto/delete-file-asset.response';
import { FileAssetHistoryResponseDto } from './dto/file-asset-history-item.response';
import { FileAssetResponseDto } from './dto/file-asset.response';
import { FileAssetHistoryQueryDto } from './dto/file-asset-status-filter.dto';
import { UploadFileRequestDto } from './dto/upload-file.request';
import { FileAssetsService } from './file-assets.service';

const MAX_UPLOAD_SIZE_BYTES = 1_073_741_824;

@ApiTags('File assets')
@Controller()
export class FileAssetsController {
  constructor(private readonly fileAssetsService: FileAssetsService) {}

  @Post('file-assets')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      dest: join(process.cwd(), 'storage/tmp'),
      limits: {
        fileSize: MAX_UPLOAD_SIZE_BYTES,
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        password: { type: 'string' },
        expirationDays: { type: 'number', minimum: 1, maximum: 7, default: 7 },
        tags: { type: 'string' },
      },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadFileRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponse<FileAssetResponseDto>> {
    return {
      status: 'success',
      message: 'Fichier téléversé avec succès.',
      data: await this.fileAssetsService.create({
        file,
        ownerId: user.id,
        dto,
      }),
    };
  }

  @Get('me/file-assets')
  @ApiBearerAuth()
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard)
  async history(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FileAssetHistoryQueryDto,
  ): Promise<ApiResponse<FileAssetHistoryResponseDto>> {
    return {
      status: 'success',
      message: 'Historique des fichiers rÃ©cupÃ©rÃ© avec succÃ¨s.',
      data: await this.fileAssetsService.getHistory(user.id, query),
    };
  }

  @Delete('file-assets/:fileAssetId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('fileAssetId') fileAssetId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ApiResponse<DeleteFileAssetResponseDto>> {
    return {
      status: 'success',
      message: 'Fichier supprimÃ© avec succÃ¨s.',
      data: await this.fileAssetsService.delete(fileAssetId, user.id),
    };
  }
}
