export interface EventTag {
  name: string
  color: string
  icon: string
}

export enum EventType {
  CM = "cm",
  TD = "td",
  TP = "tp",
  TP2 = "tp2",
  PROJECT = "project",
  EXAM = "exam",
  CLASS = "class",
}

export interface CalendarEventCustomFields {
  canceled?: boolean
  shortDescription?: string
  subject?: string
  groupColor?: string
  [key: string]: any
}

export interface FetcherCalendarEvent {
  uid: string
  title: string
  start: Date
  end: Date
  location: string
  allDay: boolean
  description: string
  teachers: string[]
  tags: EventTag[]
  type: EventType
  fields: CalendarEventCustomFields
}

export interface CalendarEvent
  extends Omit<FetcherCalendarEvent, "start" | "end"> {
  start: number
  end: number
  startsAt: Date
  endsAt: Date
  exportedAt: number
}

export interface RepCalendarEvent extends CalendarEvent {
  backgroundColor: string
  borderColor: string
  groupColor: string
  [key: string]: any
}

export interface BasicCredentials {
  username: string
  password: string
}
