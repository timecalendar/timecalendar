import { FetcherCalendarEvent } from "modules/fetch/models/event.model"

type ParsableFields = "title" | "teachers"

type FieldToParse = {
  field: ParsableFields
  regex: RegExp
  removeFromDescription?: boolean
}

export const parseFromDescriptionPipe =
  (fieldsToParse: FieldToParse[]) => (event: FetcherCalendarEvent) => {
    let lines = event.description.split("\n")

    const newFields: Partial<Pick<FetcherCalendarEvent, "title" | "teachers">> =
      {}

    fieldsToParse.forEach(({ field, regex, removeFromDescription }) => {
      lines.forEach((line) => {
        const match = line.match(regex)
        if (!match) return
        const matchingText = match[1] || match[0]

        if (field === "title") newFields.title = matchingText
        if (field === "teachers")
          newFields.teachers = [...(newFields.teachers || []), matchingText]

        if (removeFromDescription) lines = lines.filter((l) => l !== line)
      })
    })

    return {
      ...event,
      ...newFields,
      description: lines.join("\n"),
    } as FetcherCalendarEvent
  }
