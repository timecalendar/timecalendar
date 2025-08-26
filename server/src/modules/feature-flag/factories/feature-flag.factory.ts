import { FeatureFlag } from "modules/feature-flag/models/entities/feature-flag.entity"
import { AppFactory } from "test-utils/factories/app-factory"
import { factoryBuilder } from "test-utils/factories/factory-builder"

export class FeatureFlagFactory extends AppFactory<FeatureFlag> {}

export const featureFlagFactory = factoryBuilder(() => [
  FeatureFlag,
  FeatureFlagFactory.define(
    ({ params }) =>
      ({
        key: params.key ?? "default-feature-flag",
        name: "Test Feature Flag",
        description: "A test feature flag for testing purposes",
        enabled: params.enabled ?? false,
      }) as FeatureFlag,
  ),
])
