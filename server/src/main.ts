/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: `${__dirname}/../.env` })

import "config/observability/tracer"
import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import { dataSourceOptions } from "data-source"
import { AppModule } from "app.module"
import configureMainApp from "config/configure-main-app"
import { API_TOKEN, API_USERNAME, PORT, RUN_MIGRATIONS } from "config/constants"
import basicAuth from "express-basic-auth"
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

  // SharedQueueModule mounts an unauthenticated POST /queue/add controller;
  // gate the whole /queue path behind the same credentials as /admin/queues.
  app.use(
    "/queue",
    basicAuth({ users: { [API_USERNAME]: API_TOKEN }, challenge: true }),
  )

  await app.listen(PORT)
}
bootstrap()
