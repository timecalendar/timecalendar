export const testEnvVariables = {
  APP_STAGE: "test",
  DATABASE_URL: "postgres://postgres@localhost:37291/timecalendar_test",
  REDIS_QUEUE: "timecalendar-queue-test",
  REDIS_URL: "redis://127.0.0.1:37292",
  // The e2e backend runs on this env, and the dev-variant mobile client only
  // accepts export-guide images on the first-party origin it compiles, so a
  // different origin here rejects the whole guide. School logos and guide
  // images share this origin; a failed load degrades to a placeholder in both
  // apps (Flutter SchoolItem.imageErrorBuilder, RN ExportGuideImage onError).
  S3_PUBLIC_BUCKET_CLIENT_URL:
    "https://timecalendar-dev-public.fra1.digitaloceanspaces.com",
}
