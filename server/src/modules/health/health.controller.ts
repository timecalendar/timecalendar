import { Controller, Get } from "@nestjs/common"
import { ApiExcludeEndpoint } from "@nestjs/swagger"
import { HealthCheckService, TypeOrmHealthIndicator } from "@nestjs/terminus"

@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @ApiExcludeEndpoint()
  check() {
    return this.health.check([() => this.db.pingCheck("database")])
  }
}
