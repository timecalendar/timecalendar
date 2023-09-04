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

export const PORT = +(env.PORT ?? 80)
export const CLIENT_URL = env.CLIENT_URL ?? ""
export const ENABLE_QUEUE = isEnvTrue(env.ENABLE_QUEUE)

export const K8S_POD_NAME = env.K8S_POD_NAME ?? ""

export const SMTP_URL = env.SMTP_URL ?? ""
export const SMTP_FROM = env.SMTP_FROM ?? ""
export const SERVICE_ACCOUNT_KEY_PATH =
  env.SERVICE_ACCOUNT_KEY_PATH ?? "./config/serviceAccountKey.json"

export const REDIS_QUEUE_NAME = env.REDIS_QUEUE ?? "timecalendar-notifier"
export const REDIS_URL = env.REDIS_URL ?? ""
export const REDIS_KEY_PREFIX = env.REDIS_KEY_PREFIX ?? ""

export const API_USERNAME = env.API_USERNAME ?? ""
export const API_TOKEN = env.API_TOKEN ?? ""

export const DATABASE_HOST = env.DATABASE_HOST ?? ""
export const DATABASE_PORT = +(env.DATABASE_PORT ?? "")
export const DATABASE_USERNAME = env.DATABASE_USERNAME ?? ""
export const DATABASE_PASSWORD = env.DATABASE_PASSWORD ?? ""
export const DATABASE_MAIN_NAME = env.DATABASE_MAIN_NAME ?? ""
export const DATABASE_LOGGING = isEnvTrue(env.DATABASE_LOGGING)

export const RUN_MIGRATIONS = isEnvTrue(env.RUN_MIGRATIONS)
export const S3_PUBLIC_BUCKET_CLIENT_URL = env.S3_PUBLIC_BUCKET_CLIENT_URL ?? ""

export const WTF_DEBUG = isEnvTrue(env.WTF_DEBUG)

export const CRISP_IDENTIFIER = env.CRISP_IDENTIFIER ?? ""
export const CRISP_KEY = env.CRISP_KEY ?? ""
export const CRISP_WEBSITE_ID = env.CRISP_WEBSITE_ID ?? ""

export const PROXY_URL = env.PROXY_URL ?? ""
