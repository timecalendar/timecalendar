import { Body, Controller, HttpCode, Post, Res } from "@nestjs/common"
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger"
import type { Response } from "express"
import { MigrationReportService } from "./migration-report.service"

@ApiTags("Migration reports")
@Controller("v1/migration-reports")
export class MigrationReportController {
  constructor(private readonly service: MigrationReportService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: "Accept a private terminal migration report",
    description:
      "Write-only ingestion without a user session. First accepted payload wins; replay returns the same acknowledgement without exposing stored data. Limits: 60 requests per IP per minute and 10 per report ID per hour.",
  })
  @ApiBody({ schema: { $ref: getSchemaPath("MigrationReport") } })
  @ApiOkResponse({
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["accepted"],
      properties: { accepted: { type: "boolean", enum: [true] } },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid report; no submitted content is reflected",
  })
  @ApiResponse({ status: 413, description: "Body exceeds 16384 bytes" })
  @ApiResponse({
    status: 415,
    description: "Only uncompressed application/json is accepted",
  })
  @ApiResponse({
    status: 429,
    description: "Rate limited; Retry-After is seconds until the limit expires",
    headers: {
      "Retry-After": { schema: { type: "integer", minimum: 1, maximum: 3600 } },
    },
  })
  @ApiResponse({
    status: 503,
    description: "Reporting temporarily unavailable",
  })
  async accept(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const retryAfter = await this.service.accept(body)
    if (retryAfter > 0) {
      response.setHeader("Retry-After", retryAfter)
      response.status(429)
      return { statusCode: 429, message: "Report rate limit exceeded" }
    }
    return { accepted: true }
  }
}
