import { NestExpressApplication } from "@nestjs/platform-express"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"

export const createOpenApiDocument = (app: NestExpressApplication) => {
  const config = new DocumentBuilder()
    .setTitle("TimeCalendar")
    .setDescription("TimeCalendar API")
    .build()
  const document = SwaggerModule.createDocument(app, config)
  // The health endpoint is an internal liveness probe, not part of the public
  // contract. The custom HealthController excluded it via @ApiExcludeEndpoint;
  // nest-shared's SharedHealthModule controller does not, so strip it here to
  // keep the generated spec free of the probe (and byte-identical to before).
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
