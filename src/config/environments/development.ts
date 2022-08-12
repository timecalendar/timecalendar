export const developmentEnvVariables = {
  PORT: 3005,
  CLIENT_URL: "https://timecalendar.host",
  DATABASE_HOST: "localhost",
  DATABASE_PORT: "5433",
  DATABASE_USERNAME: "postgres",
  DATABASE_PASSWORD: "",
  DATABASE_MAIN_NAME: "timecalendar",
  RUN_MIGRATIONS: false,
  SERVICE_ACCOUNT_KEY_PATH: "./config/serviceAccountKey.json",
  SMTP_URL: "smtp://localhost:1025/",
  SMTP_FROM: "TimeCalendar <hello@timecalendar.app>",
  REDIS_QUEUE: "timecalendar-queue-dev",
  REDIS_URL: "redis://127.0.0.1:6370",
  REDIS_PASSWORD: "",
  API_USERNAME: "timecalendar",
  API_TOKEN: "timecalendar42",
  ENABLE_QUEUE: "true",
  S3_PUBLIC_BUCKET_CLIENT_URL:
    "https://timecalendar-dev-public.fra1.digitaloceanspaces.com",
}
