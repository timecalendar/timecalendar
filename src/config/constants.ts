import { developmentEnvVariables } from "config/environments/development"

export const NODE_ENV = process.env.NODE_ENV ?? ""

const env: any = {
  ...(NODE_ENV === "development" ? developmentEnvVariables : {}),
  ...process.env,
}

console.log(env.SERVICE_ACCOUNT_KEY_PATH)

export const PORT = +(env.PORT ?? 80)
export const CLIENT_URL = env.CLIENT_URL ?? ""

export const SMTP_URL = env.SMTP_URL ?? ""
export const SMTP_FROM = env.SMTP_FROM ?? ""
export const SERVICE_ACCOUNT_KEY_PATH =
  env.SERVICE_ACCOUNT_KEY_PATH ?? "./config/serviceAccountKey.json"

export const ENABLE_REDIS = env.ENABLE_REDIS ?? ""
export const REDIS_QUEUE_NAME = env.REDIS_QUEUE ?? "timecalendar-notifier"
export const REDIS_URL = env.REDIS_URL ?? ""
export const REDIS_PASSWORD = env.REDIS_PASSWORD ?? ""

export const API_TOKEN = env.API_TOKEN ?? ""

export const DATABASE_HOST = env.DATABASE_HOST ?? ""
export const DATABASE_PORT = +(env.DATABASE_PORT ?? "")
export const DATABASE_TEST_PORT = +(env.DATABASE_TEST_PORT ?? "")
export const DATABASE_USERNAME = env.DATABASE_USERNAME ?? ""
export const DATABASE_PASSWORD = env.DATABASE_PASSWORD ?? ""
export const DATABASE_MAIN_NAME = env.DATABASE_MAIN_NAME ?? ""

export const RUN_MIGRATIONS = env.RUN_MIGRATIONS === "true"
