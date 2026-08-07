export const NOTIFICATION_LOCALES = ["fr", "en"] as const

export type NotificationLocale = (typeof NOTIFICATION_LOCALES)[number]

export const DEFAULT_NOTIFICATION_LOCALE: NotificationLocale = "fr"

export const DEFAULT_NOTIFICATION_TIMEZONE = "Europe/Paris"
