import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ExpirationModule } from './expiration/expiration.module';
import { FileAssetsModule } from './file-assets/file-assets.module';
import { HealthModule } from './health/health.module';
import { ShareLinksModule } from './share-links/share-links.module';
import { StorageModule } from './storage/storage.module';
import { TagsModule } from './tags/tags.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      load: [configuration],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    UsersModule,
    AuthModule,
    StorageModule,
    ExpirationModule,
    HealthModule,
    FileAssetsModule,
    ShareLinksModule,
    TagsModule,
  ],
})
export class AppModule {}
