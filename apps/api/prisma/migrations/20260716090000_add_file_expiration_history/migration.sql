ALTER TABLE "file_assets" ADD COLUMN "expired_at" TIMESTAMP(3);

ALTER TABLE "file_assets" ALTER COLUMN "storage_name" DROP NOT NULL;

ALTER TABLE "file_assets" ALTER COLUMN "storage_path" DROP NOT NULL;

CREATE INDEX "file_assets_expired_at_idx" ON "file_assets"("expired_at");
