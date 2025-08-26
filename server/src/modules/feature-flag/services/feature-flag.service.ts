import { Injectable } from "@nestjs/common"
import { Client, OpenFeatureClient } from "@openfeature/nestjs-sdk"

@Injectable()
export class FeatureFlagService {
  constructor(@OpenFeatureClient() private readonly client: Client) {}

  async evaluateFlag(
    key: string,
    defaultValue: boolean = false,
    context: Record<string, any> = {},
  ): Promise<boolean> {
    try {
      const result = await this.client.getBooleanValue(
        key,
        defaultValue,
        context,
      )
      return result
    } catch (error) {
      return defaultValue
    }
  }

  async evaluateFlags(
    keys: string[],
    context: Record<string, any> = {},
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    for (const key of keys) {
      results[key] = await this.evaluateFlag(key, false, context)
    }

    return results
  }
}
