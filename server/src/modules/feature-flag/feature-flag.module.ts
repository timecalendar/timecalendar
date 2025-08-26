import { Module, OnModuleInit } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { OpenFeatureModule } from "@openfeature/nestjs-sdk"
import { OpenFeature } from "@openfeature/server-sdk"
import { FeatureFlag } from "./models/entities/feature-flag.entity"
import { FeatureFlagRepository } from "./repositories/feature-flag.repository"
import { DatabaseFeatureFlagProvider } from "./providers/database-feature-flag.provider"
import { FeatureFlagService } from "./services/feature-flag.service"
import { FeatureFlagController } from "./controllers/feature-flag.controller"

@Module({
  imports: [
    TypeOrmModule.forFeature([FeatureFlag]),
    OpenFeatureModule.forRoot({}), // Empty config, we'll set provider manually
  ],
  providers: [
    FeatureFlagRepository,
    DatabaseFeatureFlagProvider,
    FeatureFlagService,
  ],
  controllers: [FeatureFlagController],
  exports: [FeatureFlagService, DatabaseFeatureFlagProvider],
})
export class FeatureFlagModule implements OnModuleInit {
  constructor(private readonly provider: DatabaseFeatureFlagProvider) {}

  async onModuleInit() {
    // Set our custom provider when the module initializes
    await OpenFeature.setProviderAndWait(this.provider)
  }
}
