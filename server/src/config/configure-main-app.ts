import { NestExpressApplication } from "@nestjs/platform-express"
import { useContainer } from "class-validator"
import compression from "compression"
import helmet from "helmet"
import { CustomValidationPipe } from "modules/shared/pipes/custom-validation.pipe"

const configureMainApp = (module: any, app: NestExpressApplication) => {
  useContainer(module, { fallbackOnErrors: true })

  app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"])

  app.useGlobalPipes(
    new CustomValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.use(compression())

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  )

  app.enableCors({
    origin: "*",
  })

  app.enableShutdownHooks()
}

export default configureMainApp
