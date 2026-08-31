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
const progressJourney =
  /id: "checklist-check-\.\*"[\s\S]*- stopApp\n- openLink: timecalendar-dev:\/\/calendar[\s\S]*platform: iOS[\s\S]*text: "Open"[\s\S]*visible: "Calendar"[\s\S]*id: "calendar-view"[\s\S]*text: "Agenda"[\s\S]*id: "agenda-event-e2e-today-lecture-progress-1-1"[\s\S]*text: "E2E Today Lecture\(,\.\*\)\?"[\s\S]*id: "checklist-remove-\.\*"/
const bareTitle = /^\s+(?:visible|text):\s*"E2E Today Lecture"\s*$/m
const bareBack = /^\s*-\s*back\s*$/m

const progressJourneyErrors = (candidate: string): string[] => [
  ...(progressJourney.test(candidate) ? [] : ["ordered cold re-entry"]),
  ...(candidate.includes("calendar-view-agenda") ? ["stale agenda id"] : []),
  ...(bareTitle.test(candidate) ? ["bare seeded title"] : []),
  ...(bareBack.test(candidate) ? ["bare back"] : []),
]

describe("event-checklists Maestro summary-progress contract", () => {
  it("resolves the Agenda progress selector family in production source", () => {
    expect(agenda).toContain(
      "`agenda-event-${event.id}-progress-${progress.completed}-${progress.total}`",
    )
    expect(flow).toContain('id: "agenda-event-e2e-today-lecture-progress-1-1"')
  })

  it("observes all-complete progress after toggle and before retained cleanup", () => {
    expect(progressJourneyErrors(flow)).toEqual([])
    expect(flow).not.toContain('assertVisible: "1/1"')
  })

  it("rejects the stale agenda id, bare title, and platform-asymmetric back", () => {
    expect(flow).not.toContain("calendar-view-agenda")
    expect(flow).not.toMatch(bareBack)
    expect(flow).not.toMatch(bareTitle)
    expect(flow.match(/"E2E Today Lecture\(,\.\*\)\?"/g)).toHaveLength(6)
  })

  it("fails each forbidden navigation regression mutation", () => {
    const staleAgenda = flow.replace(
      'id: "calendar-view"',
      'id: "calendar-view-agenda"',
    )
    const bareSeededTitle = flow.replace(
      'visible: "E2E Today Lecture(,.*)?"',
      'visible: "E2E Today Lecture"',
    )
    const bareBackReentry = flow.replace(
      /- stopApp\n- openLink: timecalendar-dev:\/\/calendar[\s\S]*?(?=- extendedWaitUntil:\n    visible:\n      id: "agenda-event-e2e-today-lecture-progress-1-1")/,
      "- back\n",
    )

    expect(progressJourneyErrors(staleAgenda)).toContain("stale agenda id")
    expect(progressJourneyErrors(bareSeededTitle)).toContain(
      "bare seeded title",
    )
    expect(progressJourneyErrors(bareBackReentry)).toContain("bare back")
  })

  it("keeps real add, content, toggle, and hard-delete assertions", () => {
    expect(flow).toContain('id: "checklist-add"')
    expect(flow).toContain('inputText: "Buy notebook"')
    expect(flow).toContain('id: "checklist-check-.*"')
    expect(flow).toContain('id: "checklist-remove-.*"')
    expect(flow).toMatch(/notVisible: "Buy notebook"/)
  })
})
