import { NestExpressApplication } from "@nestjs/platform-express"
import { json } from "express"
import { MigrationReportRateLimiter } from "./migration-report-rate-limiter"
import {
  MIGRATION_REPORT_MAX_BYTES,
  MIGRATION_REPORT_PATH,
} from "./migration-report.schema"

export function configureMigrationReportIngress(app: NestExpressApplication) {
  const parse = json({
    limit: MIGRATION_REPORT_MAX_BYTES,
    inflate: false,
    strict: true,
  })
  // Registered before Nest's default parser: parser failures otherwise reflect raw JSON.
  app.use(MIGRATION_REPORT_PATH, async (req, res, next) => {
    try {
      const retryAfter = await app
        .get(MigrationReportRateLimiter)
        .consume("ip", req.ip ?? "unknown")
      if (retryAfter > 0) {
        res.setHeader("Retry-After", retryAfter)
        res
          .status(429)
          .json({ statusCode: 429, message: "Report rate limit exceeded" })
        return
      }
    } catch {
      res
        .status(503)
        .json({ statusCode: 503, message: "Reporting unavailable" })
      return
    }
    if (req.method !== "POST") {
      res.status(404).json({ statusCode: 404, message: "Not found" })
      return
    }
    if (
      !req.is("application/json") ||
      (req.headers["content-encoding"] &&
        req.headers["content-encoding"] !== "identity")
    ) {
      res
        .status(415)
        .json({ statusCode: 415, message: "Unsupported report media type" })
      return
    }
    parse(req, res, (error) => {
      if (error) {
        const status = error.type === "entity.too.large" ? 413 : 400
        res
          .status(status)
          .json({ statusCode: status, message: "Invalid report body" })
        return
      }
      next()
    })
  })
}
