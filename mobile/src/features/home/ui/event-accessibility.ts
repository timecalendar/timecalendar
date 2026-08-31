import type { TFunction } from "i18next"

import type { CalendarEvent } from "@/features/calendar/data"
import {
  type ChecklistProgress,
  checklistProgressLabel,
} from "@/features/event-checklists"

export function homeEventOpenLabel(
  t: TFunction,
  event: Pick<CalendarEvent, "location" | "title">,
  time: string,
  progress: ChecklistProgress | undefined,
): string {
  const values = {
    title: event.title,
    time,
    location: event.location ?? "",
  }
  const progressLabel = checklistProgressLabel(t, progress)

  return progressLabel === undefined
    ? t("home.event.openLabel", values)
    : t("home.event.openLabelWithProgress", {
        ...values,
        progress: progressLabel,
      })
}
