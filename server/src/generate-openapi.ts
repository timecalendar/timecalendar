// Emits the OpenAPI spec to openapi/openapi.json without starting an HTTP
// listener. Run via `npm run generate:openapi` (sets NODE_ENV=test), which
// needs the local docker-compose services up — same prerequisite as `npm test`.
// No dotenv here: a developer's .env would override the test env profile and
// point the script at the dev database.
process.env.SMTP_URL ??= "smtp://localhost:1025"

import { writeFileSync } from "fs"
import { join } from "path"
import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import { AppModule } from "app.module"
import { createOpenApiDocument } from "config/swagger"

const OUTPUT_PATH =
  process.env.OPENAPI_OUTPUT_PATH ??
  join(__dirname, "..", "..", "openapi", "openapi.json")

async function main() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ["error", "warn"],
  })

  try {
    const document = createOpenApiDocument(app)
    writeFileSync(OUTPUT_PATH, `${JSON.stringify(document, null, 2)}\n`)
    console.log(`OpenAPI spec written to ${OUTPUT_PATH}`)
  } finally {
    await app.close()
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      "Failed to generate the OpenAPI spec. The script needs the local",
      "docker-compose services running (same as `npm test`):",
      "docker compose -f server/docker-compose.yml up -d",
    )
    console.error(error)
    process.exit(1)
  })
