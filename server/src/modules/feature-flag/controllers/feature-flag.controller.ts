import { Controller, Get, Query } from "@nestjs/common"
import { ApiTags, ApiOperation } from "@nestjs/swagger"
import { FeatureFlagEvaluationQueryDto } from "modules/feature-flag/models/dto/feature-flag-evaluation-query.dto"
import { FeatureFlagEvaluationResponseDto } from "modules/feature-flag/models/dto/feature-flag-evaluation-response.dto"
import { FeatureFlagService } from "modules/feature-flag/services/feature-flag.service"

@ApiTags("feature-flags")
@Controller("feature-flags")
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Get("evaluate")
  @ApiOperation({ summary: "Evaluate multiple feature flags" })
  async evaluateFlags(
    @Query() query: FeatureFlagEvaluationQueryDto,
  ): Promise<FeatureFlagEvaluationResponseDto> {
    const flagKeys = query.keys.split(",").map((key) => key.trim())
    return this.featureFlagService.evaluateFlags(flagKeys)
  }
}
