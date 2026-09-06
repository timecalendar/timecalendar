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
  it("bakes an API URL on both platform builds", () => {
    // Guards the parser itself: a workflow rename that silently matched nothing
    // would make every assertion below vacuously true.
    expect(bakedBuildSteps().map((step) => step.apiUrl)).toEqual([
      "http://10.0.2.2:3005",
      "http://localhost:3005",
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
