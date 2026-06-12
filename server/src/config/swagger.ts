import { NestExpressApplication } from "@nestjs/platform-express"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"

export const createOpenApiDocument = (app: NestExpressApplication) => {
  const config = new DocumentBuilder()
    .setTitle("TimeCalendar")
    .setDescription("TimeCalendar API")
    .build()
  return SwaggerModule.createDocument(app, config)
}

export const setupSwagger = (app: NestExpressApplication) => {
  const document = createOpenApiDocument(app)
  SwaggerModule.setup("api", app, document)
}
