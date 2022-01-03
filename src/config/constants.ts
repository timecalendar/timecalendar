export const PORT = process.env.PORT ?? ""
export const CLIENT_URL = process.env.CLIENT_URL ?? ""

export const SMTP_URL = process.env.SMTP_URL ?? ""
export const SMTP_FROM = process.env.SMTP_FROM ?? ""
export const SERVICE_ACCOUNT_KEY_PATH =
  process.env.SERVICE_ACCOUNT_KEY_PATH ?? "./config/serviceAccountKey.json"

export const ENABLE_REDIS = process.env.ENABLE_REDIS ?? ""
export const REDIS_QUEUE_NAME =
  process.env.REDIS_QUEUE ?? "timecalendar-notifier"
export const REDIS_URL = process.env.REDIS_URL ?? ""
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD ?? ""

export const API_TOKEN = process.env.API_TOKEN ?? ""

export const DATABASE_HOST = process.env.DATABASE_HOST ?? ""
export const DATABASE_PORT = +(process.env.DATABASE_PORT ?? "")
export const DATABASE_TEST_PORT = +(process.env.DATABASE_TEST_PORT ?? "")
export const DATABASE_USERNAME = process.env.DATABASE_USERNAME ?? ""
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD ?? ""
export const DATABASE_MAIN_NAME = process.env.DATABASE_MAIN_NAME ?? ""

export const RUN_MIGRATIONS = process.env.RUN_MIGRATIONS === "true"
