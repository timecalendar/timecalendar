import {
  formatRelative as fnsFormatRelative,
  format as fnsFormat,
} from "date-fns"
import { fr } from "date-fns/locale"

export const formatRelative = (date: Date, baseDate: Date) => {
  const formatRelativeLocale = {
    lastWeek: "eeee 'dernier'",
    yesterday: "'hier'",
    today: "'aujourd’hui'",
    tomorrow: "'demain'",
    nextWeek: "eeee 'prochain'",
    other: "P",
  }

  const locale = {
    ...fr,
    formatRelative: (token: string) => formatRelativeLocale[token],
  }

  return fnsFormatRelative(date, baseDate, { locale })
}

export const format = (date: Date, format: string) => {
  return fnsFormat(date, format, { locale: fr })
}
