import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { ApiExcludeEndpoint } from "@nestjs/swagger"
import { GetEventsDto } from "modules/fetch/dto/get-events.dto"
import { FetchService } from "modules/fetch/services/fetch.service"
import { AuthGuard } from "modules/shared/guards/auth.guard"

@Controller()
@UseGuards(AuthGuard)
export class FetchController {
  constructor(private readonly fetchService: FetchService) {}

  @ApiExcludeEndpoint()
  @Post("events")
  async getEvents(@Body() { school, source }: GetEventsDto) {
    const debugObject: Record<string, any> = {}

    try {
      return {
        data: await this.fetchService.fetchEvents(source, school, debugObject),
        ...debugObject,
      }
    } catch (error) {
      return {
        name: error?.name ?? null,
        message: error?.message ?? null,
        stack: error?.stack ?? null,
        error: error?.error ?? null,
        ...debugObject,
      }
    }
  }
}
