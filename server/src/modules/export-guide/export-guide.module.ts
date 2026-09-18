import { join } from "path"
import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { S3_PUBLIC_BUCKET_CLIENT_URL } from "config/constants"
import {
  ExportGuideAssetReader,
  HttpExportGuideAssetReader,
} from "modules/export-guide/assets/export-guide-asset-reader"
import { ExportGuideAssetValidator } from "modules/export-guide/assets/export-guide-asset.validator"
import { ExportGuideV1Controller } from "modules/export-guide/controllers/export-guide-v1.controller"
import {
  E2E_EXPORT_GUIDE_ASSET_ORIGIN,
  INITIAL_EXPORT_GUIDE_ASSET_ORIGIN,
} from "modules/export-guide/data/initial-export-guide-catalogue"
import { PackagedInitialExportGuideAssetReader } from "modules/export-guide/data/initial-export-guide-assets"
import {
  EXPORT_GUIDE_CATALOGUE_DIRECTORY,
  ExportGuideCatalogueStore,
} from "modules/export-guide/stores/export-guide-catalogue.store"
import { ExportGuideSchoolRepository } from "modules/export-guide/repositories/export-guide-school.repository"
import { ExportGuidePublicationService } from "modules/export-guide/services/export-guide-publication.service"
import {
  EXPORT_GUIDE_INITIAL_ASSET_VALIDATOR,
  ExportGuideBootstrapService,
} from "modules/export-guide/services/export-guide-bootstrap.service"
import { ExportGuideService } from "modules/export-guide/services/export-guide.service"
import { ExportGuideCatalogueValidator } from "modules/export-guide/validation/export-guide-catalogue.validator"
import { ExportGuideUrlPolicy } from "modules/export-guide/validation/export-guide-url-policy"
import { FeatureFlagModule } from "modules/feature-flag/feature-flag.module"
import { School } from "modules/school/models/school.entity"

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
    {
      provide: EXPORT_GUIDE_INITIAL_ASSET_VALIDATOR,
      useFactory: () =>
        new ExportGuideAssetValidator(
          new PackagedInitialExportGuideAssetReader(
            join(__dirname, "data", "initial-assets"),
          ),
          new ExportGuideUrlPolicy(
            process.env.NODE_ENV === "test" &&
            process.env.EXPORT_GUIDE_E2E_FIXTURES === "1"
              ? E2E_EXPORT_GUIDE_ASSET_ORIGIN
              : INITIAL_EXPORT_GUIDE_ASSET_ORIGIN,
          ),
        ),
    },
    {
      provide: EXPORT_GUIDE_CATALOGUE_DIRECTORY,
      useValue: join(process.cwd(), "export-guide-catalogues"),
    },
    ExportGuideCatalogueStore,
    ExportGuideSchoolRepository,
    ExportGuidePublicationService,
    ExportGuideBootstrapService,
    ExportGuideService,
  ],
  exports: [
    ExportGuideCatalogueStore,
    ExportGuideCatalogueValidator,
    ExportGuidePublicationService,
  ],
})
export class ExportGuideModule {}
