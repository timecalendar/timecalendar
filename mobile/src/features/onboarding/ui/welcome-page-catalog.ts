import { type ImageSource } from "expo-image"

export const WELCOME_PAGES = [
  {
    id: "welcome",
    titleKey: "onboarding.page.welcome.title",
    bodyKey: "onboarding.page.welcome.body",
    source: require("@/assets/images/onboarding/welcome.png") as ImageSource,
  },
  {
    id: "agenda",
    titleKey: "onboarding.page.agenda.title",
    bodyKey: "onboarding.page.agenda.body",
    source: require("@/assets/images/onboarding/agenda.png") as ImageSource,
  },
  {
    id: "notifications",
    titleKey: "onboarding.page.notifications.title",
    bodyKey: "onboarding.page.notifications.body",
    source:
      require("@/assets/images/onboarding/notifications.png") as ImageSource,
  },
] as const

export type WelcomePageDescriptor = (typeof WELCOME_PAGES)[number]
