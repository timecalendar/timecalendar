import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  parseBackendEnvironment,
  parseBackendEnvironmentCapability,
  resolveBackendApiUrl,
} from "@/config/backend-environment"

// The native-E2E build-environment contract (TIM-456).
//
// The Maestro suite proves the app against a LOCAL seeded backend, and the only
// thing that points the app at it is the pair of build variables baked into the
// release bundle:
//
//   EXPO_PUBLIC_API_URL            the local URL (10.0.2.2 emulator / localhost sim)
//   BACKEND_ENVIRONMENT_CAPABILITY `development`, which is what ALLOWS the `local`
//                                  environment to be selected at all
//
// They are load-bearing together and silent apart. app.config.ts derives the
// capability from BACKEND_ENVIRONMENT_CAPABILITY alone — deliberately never from
// APP_VARIANT (add-mobile-backend-environment-selector design) — and any unset or
// unknown value parses to `production`, whose sole allowed environment is
// `production`. A build that bakes the local URL but omits the capability therefore
// resolves PRODUCTION_API_URL and discards the local URL without warning: the
// dev-import deep link asks the LIVE api for a seeded E2E token, gets a 404, and the
// flow dies on a rendered error state that names no cause.
//
// That is exactly what shipped between 2026-08-27 and this fix, and it took every
// dev-import-seeded flow on BOTH platforms down with it. The assertion below runs
// the real resolver over the real workflow rather than grepping for the variable,
// so it fails on the CONSEQUENCE (the app resolving to production) and cannot be
// satisfied by a variable that is present but set to the wrong lane.
const WORKFLOW_PATH = join(
  __dirname,
  "..",
  ".github",
  "workflows",
  "ci-mobile-e2e.yml",
)

interface BakedBuildStep {
  name: string
  apiUrl: string
  capability: string | undefined
}

// Split the workflow into steps and keep the ones that bake an API URL. Each step
// owns its own `env:` block, so a step chunk is the correct scope for the pairing.
const bakedBuildSteps = (): BakedBuildStep[] =>
  readFileSync(WORKFLOW_PATH, "utf8")
    .split(/^ {6}- name: /m)
    .slice(1)
    .filter((step) => step.includes("EXPO_PUBLIC_API_URL:"))
    .map((step) => ({
      name: step.split("\n")[0]!.trim(),
      apiUrl: /EXPO_PUBLIC_API_URL: *(\S+)/.exec(step)![1]!,
      capability: /BACKEND_ENVIRONMENT_CAPABILITY: *(\S+)/.exec(step)?.[1],
    }))

describe("native E2E build environment", () => {
  it("bakes an API URL on exactly the four prebuild and release build steps", () => {
    // Guards the parser itself, and it has to pin the step NAME, not just the URL.
    // The chunks are split on `- name:` at a fixed indent, so a step whose
    // indentation drifts is not split off — it is absorbed into the PRECEDING
    // chunk, and then inherits that neighbour's capability. The pairing assertion
    // below would pass on a value the drifted step never had. Measured: with only
    // the URLs pinned, deleting the capability from the release APK step — the
    // precise TIM-456 regression — stayed green as soon as that step's indent
    // shifted by one space. Asserting the name pins the boundary, so any drift
    // renames a step and fails here instead.
    //
    // Pinning the exact set is also what tells us when the workflow starts baking
    // the URL somewhere new: this list grew from two steps to four when the
    // prebuild steps began baking it too, and this assertion is what caught that
    // rather than the new steps going silently unchecked.
    expect(
      bakedBuildSteps().map(({ name, apiUrl }) => ({ name, apiUrl })),
    ).toEqual([
      {
        name: "Prebuild Android (dev variant)",
        apiUrl: "http://10.0.2.2:3005",
      },
      { name: "Build release APK", apiUrl: "http://10.0.2.2:3005" },
      { name: "Prebuild iOS (dev variant)", apiUrl: "http://localhost:3005" },
      { name: "Build Release simulator app", apiUrl: "http://localhost:3005" },
    ])
  })

  it.each(bakedBuildSteps())(
    "resolves the local seeded backend in '$name'",
    ({ apiUrl, capability }) => {
      const parsedCapability = parseBackendEnvironmentCapability(capability)

      // A freshly-installed E2E app has no stored selection — every flow opens
      // with `launchApp: clearState: true` — so the environment is the capability's
      // default, precisely the path that fell through to production.
      const environment = parseBackendEnvironment(undefined, parsedCapability)

      expect(resolveBackendApiUrl(environment, apiUrl)).toBe(apiUrl)
    },
  )
})
