import { PersonalEventsList } from "@/features/personal-events/ui"

// The Home/"Accueil" tab — a thin entrypoint over the @/components list module
// (route-structure rule; the list's own test lives beside the component). The
// list reads B1's reactive usePersonalEvents() and owns the Add action + empty
// state (B2 / TIM-133).
export default function HomeScreen() {
  return <PersonalEventsList />
}
