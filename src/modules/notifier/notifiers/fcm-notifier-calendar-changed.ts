import { CalendarEvent } from "src/modules/fetch/models/event"
import { format, formatRelative } from "src/modules/shared/dates/date-utils"
import { now } from "src/modules/shared/dates/now"

export enum DifferenceType {
  NEW = "new",
  EDIT = "edit",
  CANCEL = "cancel",
}

export const mapDifferenceTitle: { [type in DifferenceType]: string } = {
  [DifferenceType.NEW]: "Nouveau cours",
  [DifferenceType.EDIT]: "Cours modifié",
  [DifferenceType.CANCEL]: "Cours annulé",
}

export const getNotificationBody = (
  event: Pick<CalendarEvent, "startsAt" | "endsAt" | "title" | "location">,
) => {
  const parts: string[] = []

  if (event.title) parts.push(event.title)
  parts.push(
    `${formatRelative(event.startsAt, now())} de ${format(
      event.startsAt,
      "p",
    )} à ${format(event.endsAt, "p")}`,
  )

  const body = `${parts.join(", ")}${
    event.location ? ` (${event.location})` : ""
  }`

  return body
}
