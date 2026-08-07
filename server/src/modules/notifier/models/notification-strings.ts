import { Locale } from "date-fns"
import { enUS, fr } from "date-fns/locale"
import { NotificationLocale } from "modules/notification-subscription/models/notification-locale"
import { CalendarChangeType } from "modules/notifier/models/notifier"

export interface NotificationStrings {
  detailTitle: Record<CalendarChangeType, string>
  digestTitle: string
  digestBody: (count: number) => string
  dayFormat: string
  timeRange: (day: string, start: string, end: string) => string
  dateFnsLocale: Locale
}

export const notificationStrings: Record<
  NotificationLocale,
  NotificationStrings
> = {
  fr: {
    detailTitle: {
      new: "Nouveau cours",
      edit: "Cours modifié",
      cancel: "Cours annulé",
    },
    digestTitle: "Emploi du temps mis à jour",
    digestBody: (count) => `${count} changements dans votre emploi du temps`,
    dayFormat: "EEEE d MMMM",
    timeRange: (day, start, end) => `${day} de ${start} à ${end}`,
    dateFnsLocale: fr,
  },
  en: {
    detailTitle: {
      new: "New class",
      edit: "Class updated",
      cancel: "Class cancelled",
    },
    digestTitle: "Schedule updated",
    digestBody: (count) => `${count} changes in your schedule`,
    dayFormat: "EEEE, MMMM d",
    timeRange: (day, start, end) => `${day} from ${start} to ${end}`,
    dateFnsLocale: enUS,
  },
}
