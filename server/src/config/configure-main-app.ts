import { TypeOrmExceptionFilter } from "@lyrolab/nest-shared/database"
import { INestApplicationContext } from "@nestjs/common"
import { NestExpressApplication } from "@nestjs/platform-express"
import { useContainer } from "class-validator"
import compression from "compression"
import helmet from "helmet"
import { CustomValidationPipe } from "modules/shared/pipes/custom-validation.pipe"

const configureMainApp = (
  module: INestApplicationContext,
  app: NestExpressApplication,
) => {
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
  app.use(helmet({ contentSecurityPolicy: false }))
  app.enableCors({ origin: "*" })
  // Maps TypeORM EntityNotFoundError → 404 (e.g. findOneOrFail on a missing
  // row). Replaces the custom ErrorsInterceptor; same status, richer message
  // (includes the entity name when extractable).
  app.useGlobalFilters(new TypeOrmExceptionFilter())
  // PID 1 ignores default-action signals, so Nest cannot terminate the
  // container by removing its SIGTERM listener and re-sending the signal.
  // Exit explicitly after all shutdown lifecycle hooks have completed.
  app.enableShutdownHooks([], { useProcessExit: true })
}

export default configureMainApp
