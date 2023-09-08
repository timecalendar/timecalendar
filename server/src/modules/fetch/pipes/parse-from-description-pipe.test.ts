import { fetcherCalendarEventFactory } from "modules/fetch/factories/fetcher-calendar-event.factory"
import { parseFromDescriptionPipe } from "modules/fetch/pipes/parse-from-description-pipe"

describe("parseFromDescriptionPipe", () => {
  it("parses title", () => {
    const event = fetcherCalendarEventFactory.build({
      description: "Course: Advanced Mathematics\nTeacher: John Doe",
    })

    const newEvent = parseFromDescriptionPipe([
      {
        field: "title",
        regex: /Course: (.*)/,
      },
    ])(event)

    expect(newEvent).toMatchObject({
      ...event,
      title: "Advanced Mathematics",
      description: "Course: Advanced Mathematics\nTeacher: John Doe",
    })
  })

  it("removes the matching line in the description", () => {
    const event = fetcherCalendarEventFactory.build({
      description: "Course: Advanced Mathematics\nTeacher: John Doe",
    })

    const newEvent = parseFromDescriptionPipe([
      {
        field: "title",
        regex: /Course: (.*)/,
        removeFromDescription: true,
      },
    ])(event)

    expect(newEvent).toMatchObject({
      ...event,
      title: "Advanced Mathematics",
      description: "Teacher: John Doe",
    })
  })

  it("parses both title and teachers", () => {
    const event = fetcherCalendarEventFactory.build({
      description: "Course: Advanced Mathematics\nTeacher: John Doe",
    })

    const newEvent = parseFromDescriptionPipe([
      {
        field: "title",
        regex: /Course: (.*)/,
        removeFromDescription: true,
      },
      {
        field: "teachers",
        regex: /Teacher: (.*)/,
        removeFromDescription: true,
      },
    ])(event)

    expect(newEvent).toMatchObject({
      ...event,
      title: "Advanced Mathematics",
      teachers: ["John Doe"],
      description: "",
    })
  })

  it("matches the whole regex when there is no group", () => {
    const event = fetcherCalendarEventFactory.build({
      description: "Course: Advanced Mathematics\nTeacher: John Doe",
    })

    const newEvent = parseFromDescriptionPipe([
      {
        field: "title",
        regex: /Course: .*/,
        removeFromDescription: true,
      },
    ])(event)

    expect(newEvent).toMatchObject({
      ...event,
      title: "Course: Advanced Mathematics",
      description: "Teacher: John Doe",
    })
  })
})
