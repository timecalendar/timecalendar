import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { AuthGuard } from "modules/shared/guards/auth.guard"
import { GetEventsDto } from "./dto/get-events.dto"
import { FetchService } from "./fetch.service"

@Controller()
@UseGuards(AuthGuard)
export class FetchController {
  constructor(private readonly fetchService: FetchService) {}

  @Post("events")
  getEvents(@Body() { school, url, data }: GetEventsDto) {
    return this.fetchService.fetchEvents(url, school, data)
  }
}
