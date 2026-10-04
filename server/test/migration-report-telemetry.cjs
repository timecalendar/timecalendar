const assert = require("node:assert/strict")
const { NodeSDK } = require("@opentelemetry/sdk-node")
const {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} = require("@opentelemetry/sdk-trace-base")
const {
  createNodeInstrumentations,
} = require("../dist/config/observability/instrumentations")

const exporter = new InMemorySpanExporter()
const sdk = new NodeSDK({
  spanProcessors: [new SimpleSpanProcessor(exporter)],
  instrumentations: createNodeInstrumentations(),
})
sdk.start()

// Application modules must load after instrumentation in this standalone process.
const http = require("node:http")
const { Module } = require("@nestjs/common")
const { NestFactory } = require("@nestjs/core")
const { TypeOrmModule } = require("@nestjs/typeorm")
const { ConfigModule } = require("@nestjs/config")
const { SharedRedisModule } = require("@lyrolab/nest-shared/redis")
const configure = require("../dist/config/configure-main-app").default
const {
  MigrationReportModule,
} = require("../dist/modules/migration-report/migration-report.module")
const {
  syntheticMigrationReport,
} = require("../dist/modules/migration-report/migration-report.fixture")
const { LivenessController } = require("../dist/health/liveness.controller")

class TelemetryTestModule {}
Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
    SharedRedisModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      entities: [],
      synchronize: false,
    }),
    MigrationReportModule,
  ],
  controllers: [LivenessController],
})(TelemetryTestModule)

async function main() {
  const messages = []
  const app = await NestFactory.create(TelemetryTestModule, { logger: false })
  app.useLogger(
    Object.fromEntries(
      ["log", "error", "warn", "debug", "verbose", "fatal"].map((level) => [
        level,
        (...args) => messages.push(args),
      ]),
    ),
  )
  configure(app, app)
  await app.listen(0, "127.0.0.1")
  const port = app.getHttpServer().address().port
  const report = syntheticMigrationReport()
  const marker = "SYNTHETIC_PRIVATE_TELEMETRY_VALUE"
  const send = (method, path, body) =>
    new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          method,
          path,
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              path === "/health/live" ? "synthetic-control" : marker,
            ...(path === "/health/live"
              ? {}
              : { Authorization: `Bearer ${marker}` }),
          },
        },
        (res) => {
          let output = ""
          res.on("data", (chunk) => {
            output += chunk
          })
          res.on("end", () => resolve({ status: res.statusCode, body: output }))
        },
      )
      req.on("error", reject)
      req.end(body)
    })

  try {
    assert.equal((await send("GET", "/health/live")).status, 200)
    assert.equal(
      (
        await send(
          "POST",
          `/v1/migration-reports?token=${marker}`,
          JSON.stringify(report),
        )
      ).status,
      200,
    )
    assert.equal(
      (
        await send(
          "POST",
          "/v1/migration-reports",
          JSON.stringify({ ...report, token: marker }),
        )
      ).status,
      400,
    )
    const malformed = await send(
      "POST",
      "/v1/migration-reports",
      `{"${marker}": invalid`,
    )
    assert.equal(malformed.status, 400)
    assert.equal(malformed.body.includes(marker), false)
    assert.equal(
      (
        await send(
          "POST",
          "/v1/migration-reports",
          JSON.stringify({ token: marker.repeat(1000) }),
        )
      ).status,
      413,
    )
    const spans = exporter.getFinishedSpans()
    assert(
      spans.some(
        (span) =>
          span.kind === 1 && span.attributes["http.target"] === "/health/live",
      ),
      "Positive control: liveness must have a server HTTP span",
    )
    assert(
      !spans.some(
        (span) =>
          span.kind === 1 &&
          JSON.stringify(span.attributes).includes("migration-reports"),
      ),
      "Report requests must have no incoming HTTP span",
    )
    const serialized = JSON.stringify({
      spans: spans.map(({ name, attributes, events }) => ({
        name,
        attributes,
        events,
      })),
      messages,
    })
    assert(
      !serialized.includes(marker),
      "Private values must not reach spans or logs",
    )
    assert(
      !serialized.includes(report.calendarIds[0]),
      "Calendar IDs must not reach spans or logs",
    )
    process.stdout.write(
      JSON.stringify({
        verified: true,
        calibratedServerSpan: true,
        checkedRequests: 5,
        forbiddenValuesObserved: 0,
      }) + "\n",
    )
  } finally {
    await app.close()
    await sdk.shutdown()
  }
}

main().catch((error) => {
  process.stderr.write(
    `Migration report telemetry privacy verification failed: ${
      error instanceof assert.AssertionError ? error.message : error.name
    }\n`,
  )
  process.exitCode = 1
})
