import { Controller, Get, Headers, Query, Res } from "@nestjs/common"
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from "@nestjs/swagger"
import { Response } from "express"
import {
  ExportGuideCatalogueV1Dto,
  ExportGuideErrorDto,
} from "modules/export-guide/models/dto/export-guide.dto"
import { ExportGuideQueryDto } from "modules/export-guide/models/dto/export-guide-query.dto"
import { ExportGuideService } from "modules/export-guide/services/export-guide.service"

@Controller("v1/export-guides")
@ApiTags("Export Guides")
export class ExportGuideV1Controller {
  constructor(private readonly service: ExportGuideService) {}

  @Get()
  @ApiOperation({ summary: "Get an active or retained export-guide catalogue" })
  @ApiHeader({ name: "If-None-Match", required: false })
  @ApiOkResponse({
    type: ExportGuideCatalogueV1Dto,
    headers: {
      ETag: {
        description: "Strong validator for the exact representation",
        schema: { type: "string" },
      },
      "Content-Language": { schema: { type: "string", enum: ["fr", "en"] } },
    },
  })
  @ApiResponse({
    status: 304,
    description: "The exact strong validator matched; response has no body",
    headers: {
      ETag: { schema: { type: "string" } },
      "Content-Language": { schema: { type: "string", enum: ["fr", "en"] } },
    },
  })
  @ApiBadRequestResponse({ type: ExportGuideErrorDto })
  @ApiNotFoundResponse({ type: ExportGuideErrorDto })
  @ApiServiceUnavailableResponse({ type: ExportGuideErrorDto })
  async findCatalogue(
    @Query() query: ExportGuideQueryDto,
    @Headers("if-none-match") ifNoneMatch: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const representation = await this.service.get(
      query.locale,
      query.clientSchema,
      query.catalogueVersion,
    )
    response.setHeader("ETag", representation.etag)
    response.setHeader("Content-Language", representation.locale)
    if (
      ifNoneMatch
        ?.split(",")
        .map((value) => value.trim())
        .includes(representation.etag)
    ) {
      response.status(304).end()
      return
    }
    response.setHeader("Content-Type", "application/json; charset=utf-8")
    response.setHeader(
      "Content-Length",
      Buffer.byteLength(representation.body, "utf8"),
    )
    response.status(200).end(representation.body)
  }
}
