import { Injectable, Logger as NestLogger } from "@nestjs/common"
import {
  ErrorCode,
  JsonValue,
  Provider,
  ProviderMetadata,
  ResolutionDetails,
} from "@openfeature/server-sdk"
import { FeatureFlagRepository } from "modules/feature-flag/repositories/feature-flag.repository"

@Injectable()
export class DatabaseFeatureFlagProvider implements Provider {
  public readonly runsOn = "server" as const
  readonly metadata: ProviderMetadata = {
    name: "DatabaseFeatureFlagProvider",
  }

  private readonly logger = new NestLogger(DatabaseFeatureFlagProvider.name)

  constructor(private readonly repository: FeatureFlagRepository) {}

  async resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
  ): Promise<ResolutionDetails<boolean>> {
    try {
      this.logger.debug(`Evaluating flag: ${flagKey}`)

      const flag = await this.repository.findByKey(flagKey)

      if (!flag) {
        this.logger.debug(
          `Flag not found: ${flagKey}, using default: ${defaultValue}`,
        )
        return {
          value: defaultValue,
          reason: "DEFAULT",
        }
      }

      this.logger.debug(`Flag found: ${flagKey}, value: ${flag.enabled}`)
      return {
        value: flag.enabled,
        reason: "TARGETING_MATCH",
      }
    } catch (error) {
      this.logger.error(`Error evaluating flag ${flagKey}:`, error)
      return {
        value: defaultValue,
        reason: "ERROR",
        errorCode: ErrorCode.GENERAL,
        errorMessage: error.message,
      }
    }
  }

  // Required by OpenFeature Provider interface but not used for boolean flags
  async resolveStringEvaluation(
    _flagKey: string,
    defaultValue: string,
  ): Promise<ResolutionDetails<string>> {
    return {
      value: defaultValue,
      reason: "DEFAULT",
    }
  }

  async resolveNumberEvaluation(
    _flagKey: string,
    defaultValue: number,
  ): Promise<ResolutionDetails<number>> {
    return {
      value: defaultValue,
      reason: "DEFAULT",
    }
  }

  async resolveObjectEvaluation<T extends JsonValue>(
    _flagKey: string,
    defaultValue: T,
  ): Promise<ResolutionDetails<T>> {
    return {
      value: defaultValue,
      reason: "DEFAULT",
    }
  }
}
