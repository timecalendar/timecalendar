/* eslint-disable @typescript-eslint/no-var-requires */
require("dotenv").config({ path: `${__dirname}/../.env` })

import { CLIENT_URL, PORT } from "./config/constants"
import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import compression from "compression"
import helmet from "helmet"
import { AppModule } from "./app.module"
import { setupSwagger } from "./config/swagger"
import { NestExpressApplication } from "@nestjs/platform-express"

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  app.useGlobalPipes(new ValidationPipe())

  // decrease the size of the response body
  app.use(compression())

  // protect app from some well-known web vulnerabilities by setting HTTP headers appropriately
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  )

  setupSwagger(app)

  app.enableCors({
    origin: CLIENT_URL,
  })

  await app.listen(PORT)
}
bootstrap()
