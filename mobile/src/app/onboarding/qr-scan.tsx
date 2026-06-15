// Thin route entrypoint (route-structure rule): the QR scanner step, reachable
// as a sibling under the onboarding Stack via router.push("/onboarding/qr-scan").
// The screen lives in @/features/calendar-sources/ui; the route is a one-line
// re-export through the ui/ sub-barrel (no colocated test — Metro bundles every
// *.tsx under src/app/ as a route).
export { QrScanScreen as default } from "@/features/calendar-sources/ui"
