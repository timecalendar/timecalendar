/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: `${__dirname}/../.env` })

import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import { dataSourceOptions } from "data-source"
import { AppModule } from "app.module"
import configureMainApp from "config/configure-main-app"
import { CLIENT_URL, PORT, RUN_MIGRATIONS } from "config/constants"
import { setupSwagger } from "config/swagger"
import { runMigrations } from "modules/shared/utils/run-migrations"

async function bootstrap() {
  if (RUN_MIGRATIONS) await runMigrations(dataSourceOptions)

  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  configureMainApp(app.select(AppModule), app)

  setupSwagger(app)
  app.enableCors({ origin: CLIENT_URL })
  app.enableShutdownHooks()

  await app.listen(PORT)
}
bootstrap()
