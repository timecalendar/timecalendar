export const EXPORT_GUIDE_CLIENT_SCHEMA = 1 as const
export const EXPORT_GUIDE_MAX_BODY_BYTES = 512 * 1024
export const EXPORT_GUIDE_MAX_AGE_MS = 24 * 60 * 60 * 1000

export const EXPORT_GUIDE_ASSET_ORIGINS = Object.freeze([
  "https://timecalendar-dev-public.fra1.digitaloceanspaces.com",
] as const)

export const EXPORT_GUIDE_PROVIDER_SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/
export const EXPORT_GUIDE_MIME_TYPES = Object.freeze([
  "image/png",
  "image/jpeg",
  "image/webp",
] as const)

export const EXPORT_GUIDE_IMAGE_MAX_BYTES = Object.freeze({
  thumbnail: 256 * 1024,
  page: 1024 * 1024,
} as const)
export const EXPORT_GUIDE_IMAGE_MAX_DIMENSION = 4096
export const EXPORT_GUIDE_IMAGE_MAX_PIXELS = 8 * 1024 * 1024
