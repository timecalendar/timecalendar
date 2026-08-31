/// <reference types="node" />
import { readFileSync } from "node:fs"
import { join } from "node:path"

const mobileRoot = join(__dirname, "..")
const flow = readFileSync(
  join(mobileRoot, ".maestro", "event-checklists.yaml"),
  "utf8",
)
const agenda = readFileSync(
  join(mobileRoot, "src", "features", "calendar", "ui", "agenda-list.tsx"),
  "utf8",
)

describe("event-checklists Maestro summary-progress contract", () => {
  it("resolves the Agenda progress selector family in production source", () => {
    expect(agenda).toContain(
      "`agenda-event-${event.id}-progress-${progress.completed}-${progress.total}`",
    )
    expect(flow).toContain('id: "agenda-event-e2e-today-lecture-progress-1-1"')
  })

  it("observes all-complete progress after toggle and before retained cleanup", () => {
    expect(flow).toMatch(
      /id: "checklist-check-\.\*"[\s\S]*- back[\s\S]*agenda-event-e2e-today-lecture-progress-1-1[\s\S]*assertVisible: "1\/1"[\s\S]*id: "checklist-remove-\.\*"/,
    )
  })

  it("keeps real add, content, toggle, and hard-delete assertions", () => {
    expect(flow).toContain('id: "checklist-add"')
    expect(flow).toContain('inputText: "Buy notebook"')
    expect(flow).toContain('id: "checklist-check-.*"')
    expect(flow).toContain('id: "checklist-remove-.*"')
    expect(flow).toMatch(/notVisible: "Buy notebook"/)
  })
})
