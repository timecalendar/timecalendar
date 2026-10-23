import { TypeOrmExceptionFilter } from "@lyrolab/nest-shared/database"
import { INestApplicationContext } from "@nestjs/common"
import { NestExpressApplication } from "@nestjs/platform-express"
import { useContainer } from "class-validator"
import compression from "compression"
import { json } from "express"
import helmet from "helmet"
import { CustomValidationPipe } from "modules/shared/pipes/custom-validation.pipe"

const configureMainApp = (
  module: INestApplicationContext,
  app: NestExpressApplication,
) => {
  useContainer(module, { fallbackOnErrors: true })
  app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"])
  const parseMigrationReport = json({ limit: "16kb" })
  // Wrapped: Nest skips its global JSON parser when a layer named jsonParser exists.
  app.use("/v1/migration-reports", (req, res, next) =>
    parseMigrationReport(req, res, next),
  )
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
}

export default configureMainApp
