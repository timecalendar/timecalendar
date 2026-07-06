import { Stack } from "expo-router"

// Nested Stack under the Calendar tab so the OS draws a real navigation bar — the
// calendar screen sets the month title + the view-menu / Today / Add header
// actions via its own <Stack.Screen options>. The tab's route is now this layout;
// its index is still /calendar (a layout folder doesn't change the URL), so the
// timecalendar-dev://calendar deep link + the Maestro flow keep resolving and the
// NativeTabs "calendar" trigger keeps selecting it.
export default function CalendarStackLayout() {
  return <Stack screenOptions={{ headerShown: true }} />
}
