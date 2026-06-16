// EXPO_PUBLIC_API_URL is inlined at build time (Expo's public env mechanism).
// Dev gotcha: Android emulators reach the host machine via 10.0.2.2, not
// localhost — point EXPO_PUBLIC_API_URL there when targeting a local server.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://api-v2.timecalendar.app"
