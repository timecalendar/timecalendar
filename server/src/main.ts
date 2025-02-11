/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: `${__dirname}/../.env` })

import "config/observability/tracer"
import "lib/dayjs"
import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import { dataSourceOptions } from "data-source"
import { AppModule } from "app.module"
import configureMainApp from "config/configure-main-app"
import { PORT, RUN_MIGRATIONS } from "config/constants"
import { setupSwagger } from "config/swagger"
import { runMigrations } from "modules/shared/utils/run-migrations"
import bullBoardAdapter from "modules/shared/adapters/bull-board.adapter"

async function bootstrap() {
  if (RUN_MIGRATIONS) await runMigrations(dataSourceOptions)

  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const server = app.getHttpServer()

  server.setTimeout(120000)
  server.keepAliveTimeout = 120000
  server.headersTimeout = 125000

  configureMainApp(app.select(AppModule), app)

  setupSwagger(app)
  app.enableCors({ origin: "*" })
  app.enableShutdownHooks()
  bullBoardAdapter(app)

  await app.listen(PORT)
}
bootstrap()
