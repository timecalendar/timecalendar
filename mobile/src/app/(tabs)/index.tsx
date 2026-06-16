export { HomeScreen as default } from "@/features/home/ui"

// The Home/"Accueil" tab — the today / next-up landing view (ADR 022). A thin
// entrypoint over the home feature's ui sub-barrel (route-structure rule; the
// screen's own test lives beside it). The screen reads the merged synced+personal
// events through the unchanged useCalendarEvents seam and renders the header,
// upcoming scroller, and today mini-timeline. The standalone personal-events list
// relocated to the /personal-events route (reached from Profile).
