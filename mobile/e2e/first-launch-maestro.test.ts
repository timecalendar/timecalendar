/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const mobileRoot = join(__dirname, "..")
const maestroRoot = join(mobileRoot, ".maestro")
const readFlow = (path: string) => readFileSync(join(maestroRoot, path), "utf8")

describe("first-launch Maestro flows", () => {
  it("keeps the reusable Skip setup nested and applies it to cleared empty flows", () => {
    expect(readdirSync(maestroRoot)).not.toContain("resolve-first-launch.yaml")
    expect(readFlow("setup/resolve-first-launch.yaml")).toContain(
      'id: "import-later-confirm"',
    )

    for (const flow of [
      "about.yaml",
      "appearance-settings.yaml",
      "environment-switch.yaml",
      "feedback.yaml",
      "personal-events.yaml",
      "settings.yaml",
      "user-calendars.yaml",
    ]) {
      expect(readFlow(flow)).toContain(
        "runFlow: setup/resolve-first-launch.yaml",
      )
    }
  })

  it("uses selectors that exist on the fresh-install production surfaces", () => {
    const flow = readFlow("first-launch.yaml")
    const welcome = readFileSync(
      join(mobileRoot, "src/features/onboarding/ui/welcome-screen.tsx"),
      "utf8",
    )
    const confirmation = readFileSync(
      join(
        mobileRoot,
        "src/features/first-launch/ui/import-later-confirmation.tsx",
      ),
      "utf8",
    )
    const reminder = readFileSync(
      join(mobileRoot, "src/features/first-launch/ui/first-ical-reminder.tsx"),
      "utf8",
    )

    expect(welcome).toContain('testID="onboarding-skip"')
    expect(confirmation).toContain('testID="import-later-confirm"')
    expect(reminder).toContain('testID="first-ical-reminder"')
    expect(flow).toContain('id: "personal-event-title-input"')
    expect(flow).toContain('id: "first-ical-reminder"')
  })
})
