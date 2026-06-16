import { developmentEnvVariables } from "config/environments/development"
import { testEnvVariables } from "config/environments/test"

type Environment = "development" | "test" | "production"

const isEnvTrue = (value?: string) =>
  Boolean(value && (value === "1" || value === "true"))

export const NODE_ENV: Environment = (process.env.NODE_ENV ??
  "development") as Environment

const env: any = {
  ...(NODE_ENV === "development" ? developmentEnvVariables : {}),
  ...(NODE_ENV === "test" ? testEnvVariables : {}),
  ...process.env,
}

// nest-shared reads connection strings straight from `process.env` —
// `SharedDatabaseModule.forRoot` via `ConfigService.get("DATABASE_URL")`, and
// `setupTestDatabase()` via `process.env.DATABASE_URL` directly. TimeCalendar's
// per-environment defaults (development.ts / test.ts) only live in this merged
// `env` object, so mirror them back into `process.env` for any key the real
// environment hasn't already set (real env always wins — `...process.env` above
// is last in the spread). This is the single bridge that lets the local/CI Jest
// run and `npm run dev` resolve `DATABASE_URL` without exporting it by hand.
for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined && value !== undefined) {
    process.env[key] = String(value)
  }
}

export const APP_STAGE = env.APP_STAGE ?? "development"
export const PORT = +(env.PORT ?? 80)
export const CLIENT_URL = env.CLIENT_URL ?? ""

export const ENABLE_QUEUE = isEnvTrue(env.ENABLE_QUEUE)
export const QUEUE_CONCURRENCY = +(env.QUEUE_CONCURRENCY ?? 100)

export const K8S_POD_NAME = env.K8S_POD_NAME ?? ""

export const SMTP_URL = env.SMTP_URL ?? ""
export const SMTP_FROM = env.SMTP_FROM ?? ""
export const SERVICE_ACCOUNT_KEY_PATH =
  env.SERVICE_ACCOUNT_KEY_PATH ?? "./config/serviceAccountKey.json"

export const REDIS_QUEUE_NAME = env.REDIS_QUEUE ?? "timecalendar-notifier"
export const REDIS_URL = env.REDIS_URL ?? ""

export const API_USERNAME = env.API_USERNAME ?? ""
export const API_TOKEN = env.API_TOKEN ?? ""

export const DATABASE_URL = env.DATABASE_URL ?? ""
export const DATABASE_LOGGING = isEnvTrue(env.DATABASE_LOGGING)

export const RUN_MIGRATIONS = isEnvTrue(env.RUN_MIGRATIONS)
export const S3_PUBLIC_BUCKET_CLIENT_URL = env.S3_PUBLIC_BUCKET_CLIENT_URL ?? ""

export const WTF_DEBUG = isEnvTrue(env.WTF_DEBUG)

export const CRISP_IDENTIFIER = env.CRISP_IDENTIFIER ?? ""
export const CRISP_KEY = env.CRISP_KEY ?? ""
export const CRISP_WEBSITE_ID = env.CRISP_WEBSITE_ID ?? ""

export const PROXY_URL = env.PROXY_URL ?? ""

export const OTEL_ENABLED = isEnvTrue(env.OTEL_ENABLED)
export const OTEL_EXPORTER_URL = env.OTEL_EXPORTER_URL ?? ""

export const OPENAI_API_KEY = env.OPENAI_API_KEY ?? ""
