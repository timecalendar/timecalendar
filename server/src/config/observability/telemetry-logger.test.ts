import { ConsoleLogger, Logger, LoggerService } from "@nestjs/common"
import { SeverityNumber, logs } from "@opentelemetry/api-logs"
import { context, trace, TraceFlags } from "@opentelemetry/api"
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks"
import {
  InMemoryLogRecordExporter,
  LoggerProvider,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs"
import { EntityNotFoundError } from "typeorm"
import { TelemetryLogger } from "./telemetry-logger"

describe("TelemetryLogger", () => {
  const levels = ["log", "error", "warn", "debug", "verbose", "fatal"] as const

  const createLogger = () => {
    const consoleLogger = Object.fromEntries(
      levels.map((level) => [level, jest.fn()]),
    ) as unknown as LoggerService
    const otelLogger = { emit: jest.fn(), enabled: jest.fn(() => true) }
    return {
      consoleLogger,
      otelLogger,
      logger: new TelemetryLogger(consoleLogger, otelLogger),
    }
  }

  it.each([
    ["log", SeverityNumber.INFO],
    ["error", SeverityNumber.ERROR],
    ["warn", SeverityNumber.WARN],
    ["debug", SeverityNumber.DEBUG],
    ["verbose", SeverityNumber.TRACE],
    ["fatal", SeverityNumber.FATAL],
  ] as const)(
    "maps %s to its OTel severity and preserves console output",
    (level, severity) => {
      const { consoleLogger, otelLogger, logger } = createLogger()
      logger[level]("safe message", "CalendarSyncService")

      expect(consoleLogger[level]).toHaveBeenCalledWith(
        "safe message",
        "CalendarSyncService",
      )
      expect(otelLogger.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          severityNumber: severity,
          body: "safe message",
          attributes: { context: "CalendarSyncService" },
        }),
      )
    },
  )

  it("sanitizes once before both sinks", () => {
    const { consoleLogger, otelLogger, logger } = createLogger()
    const secret = "https://ade.ensea.fr/feed?token=top-secret"
    logger.error(new TypeError(`failed ${secret}`), "CalendarSyncService")

    const consoleBody = (consoleLogger.error as jest.Mock).mock.calls[0][0]
    const exportedBody = otelLogger.emit.mock.calls[0][0].body
    expect(consoleBody).toBe(exportedBody)
    expect(exportedBody).not.toContain(secret)
    expect(otelLogger.emit).toHaveBeenCalledTimes(1)
  })

  it("never exports a calendar token from an entity-not-found debug log", () => {
    const { otelLogger, logger } = createLogger()
    const token = "-1StGXR8Z5jdHi6BmyTa-"
    logger.debug(
      new EntityNotFoundError("Calendar", { token }),
      "CalendarService",
    )

    expect(otelLogger.emit).toHaveBeenCalledTimes(1)
    expect(otelLogger.emit.mock.calls[0][0].body).not.toContain(token)
  })

  it("keeps logging when the OTel API has no exporter provider", () => {
    const consoleLogger = { log: jest.fn() } as unknown as LoggerService
    const logger = new TelemetryLogger(consoleLogger)
    expect(() => logger.log("console only", "Test")).not.toThrow()
    expect(consoleLogger.log).toHaveBeenCalled()
  })

  it("inherits active trace and span correlation", async () => {
    const exporter = new InMemoryLogRecordExporter()
    const provider = new LoggerProvider({
      processors: [new SimpleLogRecordProcessor(exporter)],
    })
    const contextManager = new AsyncLocalStorageContextManager().enable()
    context.setGlobalContextManager(contextManager)
    logs.setGlobalLoggerProvider(provider)
    const spanContext = {
      traceId: "1234567890abcdef1234567890abcdef",
      spanId: "1234567890abcdef",
      traceFlags: TraceFlags.SAMPLED,
    }
    const consoleLogger = { error: jest.fn() } as unknown as LoggerService

    context.with(trace.setSpanContext(context.active(), spanContext), () => {
      new TelemetryLogger(consoleLogger).error("correlated", "Test")
    })
    await provider.forceFlush()

    expect(exporter.getFinishedLogRecords()[0].spanContext).toMatchObject(
      spanContext,
    )
    await provider.shutdown()
    contextManager.disable()
    logs.disable()
  })

  it("receives existing contextual Logger calls without call-site rewrites", () => {
    const { otelLogger, logger } = createLogger()
    Logger.overrideLogger(logger)
    new Logger("LegacySchedulerCleanupService").error("cleanup failed")
    expect(otelLogger.emit).toHaveBeenCalledTimes(1)
    expect(otelLogger.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: { context: "LegacySchedulerCleanupService" },
      }),
    )
    Logger.overrideLogger(new ConsoleLogger())
  })
})
