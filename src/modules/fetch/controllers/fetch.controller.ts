import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { GetEventsDto } from "modules/fetch/dto/get-events.dto"
import { FetchService } from "modules/fetch/services/fetch.service"
import { AuthGuard } from "modules/shared/guards/auth.guard"

@Controller()
@UseGuards(AuthGuard)
export class FetchController {
  constructor(private readonly fetchService: FetchService) {}

  @Post("events")
  getEvents(@Body() { school, source }: GetEventsDto) {
    return this.fetchService.fetchEvents(source, school)
  }
}
