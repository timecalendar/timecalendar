import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import {
  ExportGuideAssetReader,
  HttpExportGuideAssetReader,
} from "modules/export-guide/assets/export-guide-asset-reader"
import { ExportGuideAssetValidator } from "modules/export-guide/assets/export-guide-asset.validator"
import { ExportGuideV1Controller } from "modules/export-guide/controllers/export-guide-v1.controller"
import { ExportGuideCatalogueStore } from "modules/export-guide/stores/export-guide-catalogue.store"
import { ExportGuideSchoolRepository } from "modules/export-guide/repositories/export-guide-school.repository"
import { ExportGuidePublicationService } from "modules/export-guide/services/export-guide-publication.service"
import { ExportGuideService } from "modules/export-guide/services/export-guide.service"
import { ExportGuideCatalogueValidator } from "modules/export-guide/validation/export-guide-catalogue.validator"
import { ExportGuideUrlPolicy } from "modules/export-guide/validation/export-guide-url-policy"
import { FeatureFlagModule } from "modules/feature-flag/feature-flag.module"
import { School } from "modules/school/models/school.entity"
import { S3_PUBLIC_BUCKET_CLIENT_URL } from "config/constants"

@Module({
  imports: [FeatureFlagModule, TypeOrmModule.forFeature([School])],
  controllers: [ExportGuideV1Controller],
  providers: [
    ExportGuideCatalogueValidator,
    {
      provide: "EXPORT_GUIDE_ASSET_ORIGIN",
      useValue: S3_PUBLIC_BUCKET_CLIENT_URL,
    },
    ExportGuideUrlPolicy,
    { provide: ExportGuideAssetReader, useClass: HttpExportGuideAssetReader },
    ExportGuideAssetValidator,
    ExportGuideCatalogueStore,
    ExportGuideSchoolRepository,
    ExportGuidePublicationService,
    ExportGuideService,
  ],
  exports: [
    ExportGuideCatalogueStore,
    ExportGuideCatalogueValidator,
    ExportGuidePublicationService,
  ],
})
export class ExportGuideModule {}
