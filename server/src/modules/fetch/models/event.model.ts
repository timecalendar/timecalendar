import { IsBoolean, IsString } from "class-validator"

export class EventTag {
  @IsString()
  name: string

  @IsString()
  color: string

  @IsString()
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

export class CalendarEventCustomFields {
  @IsBoolean()
  canceled?: boolean

  @IsString()
  shortDescription?: string

  @IsString()
  subject?: string

  @IsString()
  groupColor?: string;

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

// TODO: move it in CalendarSync
export interface RepCalendarEvent {
  backgroundColor: string
  borderColor: string
  groupColor: string
  [key: string]: any
}

export interface BasicCredentials {
  username: string
  password: string
}
