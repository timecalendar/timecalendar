import {
  Logger as OTelLogger,
  logs,
  SeverityNumber,
} from "@opentelemetry/api-logs"
import { ConsoleLogger, LoggerService } from "@nestjs/common"
import { sanitizeLog } from "./sanitize-log"

type NestLogLevel = "debug" | "error" | "fatal" | "log" | "verbose" | "warn"

const SEVERITY: Record<NestLogLevel, SeverityNumber> = {
  debug: SeverityNumber.DEBUG,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
  log: SeverityNumber.INFO,
  verbose: SeverityNumber.TRACE,
  warn: SeverityNumber.WARN,
}

export class TelemetryLogger implements LoggerService {
  constructor(
    private readonly consoleLogger: LoggerService = new ConsoleLogger(),
    private readonly otelLogger: OTelLogger = logs.getLogger(
      "timecalendar-application",
    ),
  ) {}

  private emit(level: NestLogLevel, message: unknown, params: unknown[]) {
    const sanitized = sanitizeLog(message, params)
    this.consoleLogger[level]?.(
      sanitized.body,
      ...(sanitized.attributes.context ? [sanitized.attributes.context] : []),
    )
    this.otelLogger.emit({
      severityNumber: SEVERITY[level],
      severityText: level.toUpperCase(),
      body: sanitized.body,
      attributes: sanitized.attributes,
    })
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    this.emit("log", message, optionalParams)
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    this.emit("error", message, optionalParams)
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    this.emit("warn", message, optionalParams)
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    this.emit("debug", message, optionalParams)
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    this.emit("verbose", message, optionalParams)
  }

  fatal(message: unknown, ...optionalParams: unknown[]) {
    this.emit("fatal", message, optionalParams)
  }
}
