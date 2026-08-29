import { Controller, Get } from "@nestjs/common"
import { ApiExcludeEndpoint } from "@nestjs/swagger"

@Controller("health")
export class LivenessController {
  @ApiExcludeEndpoint()
  @Get("live")
  getLiveness() {
    return { status: "ok" }
  }
}
