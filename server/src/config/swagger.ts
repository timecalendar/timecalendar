import { NestExpressApplication } from "@nestjs/platform-express"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"

export const createOpenApiDocument = (app: NestExpressApplication) => {
  const config = new DocumentBuilder()
    .setTitle("TimeCalendar")
    .setDescription("TimeCalendar API")
    .build()
  const document = SwaggerModule.createDocument(app, config)
  // The database-backed health endpoint is an internal dependency/readiness
  // probe, not part of the public contract. The local liveness controller can
  // exclude /health/live via @ApiExcludeEndpoint; nest-shared's controller
  // cannot be annotated here, so strip /health explicitly.
  delete document.paths["/health"]
  // nest-shared's QueueController is a dev/admin surface, not part of the
  // public contract the mobile client is generated from.
  delete document.paths["/queue/add"]
  delete document.components?.schemas?.["QueueAddDto"]
  return document
}

export const setupSwagger = (app: NestExpressApplication) => {
  const document = createOpenApiDocument(app)
  SwaggerModule.setup("api", app, document)
}
