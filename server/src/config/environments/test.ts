export const testEnvVariables = {
  APP_STAGE: "test",
  DATABASE_URL: "postgres://postgres@localhost:37291/timecalendar_test",
  REDIS_QUEUE: "timecalendar-queue-test",
  REDIS_URL: "redis://127.0.0.1:37292",
  ENABLE_QUEUE: "false",
  // School logo URLs are built as S3_PUBLIC_BUCKET_CLIENT_URL + imageUrl. A
  // loopback host keeps the E2E onboarding flow deterministic: a seeded logo
  // never triggers an outbound DNS lookup, so the test outcome cannot depend
  // on emulator network behaviour. The port is intentionally unbound — the
  // load fails fast with a connection refusal and the app falls back to its
  // placeholder (see app SchoolItem.imageErrorBuilder).
  S3_PUBLIC_BUCKET_CLIENT_URL: "http://127.0.0.1:9",
}
