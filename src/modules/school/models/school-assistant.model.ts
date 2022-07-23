import _ from "lodash"

export class SchoolAssistant {
  slug: string
  requireIntranetAccess: boolean
  requireCalendarName: boolean
  isNative: boolean
}

const assistants = [
  {
    slug: "ade",
    requireIntranetAccess: true,
    requireCalendarName: true,
    isNative: false,
  },
  {
    slug: "celcat",
    requireIntranetAccess: true,
    requireCalendarName: true,
    isNative: false,
  },
  {
    slug: "epitech",
    requireIntranetAccess: false,
    requireCalendarName: true,
    isNative: false,
  },
  {
    slug: "generic",
    requireIntranetAccess: true,
    requireCalendarName: true,
    isNative: false,
  },
  {
    slug: "groups",
    requireIntranetAccess: false,
    requireCalendarName: false,
    isNative: false,
  },
  {
    slug: "hplanning",
    requireIntranetAccess: true,
    requireCalendarName: true,
    isNative: false,
  },
  {
    slug: "select",
    requireIntranetAccess: true,
    requireCalendarName: true,
    isNative: false,
  },
  {
    slug: "univorleans",
    requireIntranetAccess: false,
    requireCalendarName: false,
    isNative: false,
  },
  {
    slug: "univtoulouse3",
    requireIntranetAccess: false,
    requireCalendarName: false,
    isNative: false,
  },
  {
    slug: "upsud",
    requireIntranetAccess: false,
    requireCalendarName: false,
    isNative: false,
  },
  {
    slug: "nantes",
    requireIntranetAccess: true,
    requireCalendarName: true,
    isNative: false,
  },
]

const schoolAssistants = _.keyBy(assistants, "slug")

export const getSchoolAssistant = (assistant: string | null) => {
  return assistant === null ? null : schoolAssistants[assistant] ?? null
}
