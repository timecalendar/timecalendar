import Constants from "expo-constants"

// The single runtime read of the build-time app variant (ADR 030). `app.config.ts`
// embeds `extra.appVariant: IS_DEV ? "development" : "production"` into the resolved
// manifest at build time; `Constants.expoConfig?.extra` surfaces it in the JS
// runtime in both debug and release configs.
//
// This is the security boundary for the dev-only import deep link
// (src/app/dev-import.tsx): the route file ships in the prod bundle and is reachable
// as `timecalendar://dev-import?token=…`, so the *action* must be gated on the
// variant, not the scheme. `__DEV__` is the wrong tool — the e2e build is a
// release-config dev variant where `__DEV__` is `false`. Keeping the read in one
// named helper makes the gate testable and swappable.
export function isDevVariant(): boolean {
  return Constants.expoConfig?.extra?.appVariant === "development"
}
