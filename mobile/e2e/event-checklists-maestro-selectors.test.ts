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
const exactReveal =
  /- scrollUntilVisible:\n    element:\n      id: "checklist-input-\.\*"\n      text: "Buy notebook"\n    direction: DOWN\n    visibilityPercentage: 100\n    centerElement: true\n    timeout: 30000/
const exactReadinessGate =
  /- extendedWaitUntil:\n    visible:\n      id: "checklist-input-\.\*"\n      text: "Buy notebook"\n    timeout: 15000/
const preTogglePersistenceJourney =
  /- inputText: "Buy notebook"[\s\S]*- scrollUntilVisible:[\s\S]*visibilityPercentage: 100[\s\S]*centerElement: true[\s\S]*timeout: 30000[\s\S]*- extendedWaitUntil:[\s\S]*id: "checklist-input-\.\*"[\s\S]*text: "Buy notebook"[\s\S]*timeout: 15000[\s\S]*- stopApp\n- openLink: timecalendar-dev:\/\/calendar[\s\S]*visible: "Buy notebook"[\s\S]*id: "checklist-check-\.\*"[\s\S]*id: "agenda-event-e2e-today-lecture-progress-1-1"[\s\S]*id: "checklist-remove-\.\*"[\s\S]*notVisible: "Buy notebook"/
const bareTitle = /^\s+(?:visible|text):\s*"E2E Today Lecture"\s*$/m
const bareBack = /^\s*-\s*back\s*$/m

const progressJourneyErrors = (candidate: string): string[] => [
  ...(progressJourney.test(candidate) ? [] : ["ordered cold re-entry"]),
  ...(candidate.includes("calendar-view-agenda") ? ["stale agenda id"] : []),
  ...(bareTitle.test(candidate) ? ["bare seeded title"] : []),
  ...(bareBack.test(candidate) ? ["bare back"] : []),
]

const persistenceJourneyErrors = (candidate: string): string[] => [
  ...(exactReveal.test(candidate) ? [] : ["exact bounded reveal"]),
  ...(exactReadinessGate.test(candidate) ? [] : ["exact readiness gate"]),
  ...(preTogglePersistenceJourney.test(candidate)
    ? []
    : ["ordered persistence round trip"]),
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

  it("reveals the focused exact input before gating and cold re-entry", () => {
    expect(persistenceJourneyErrors(flow)).toEqual([])
  })

  it("rejects missing, widened, late, or partially visible reveal mutations", () => {
    const reveal = flow.match(exactReveal)?.[0]
    const gate = flow.match(exactReadinessGate)?.[0]

    expect(reveal).toBeDefined()
    expect(gate).toBeDefined()

    const removed = flow.replace(`${reveal}\n`, "")
    const widened = flow.replace(
      `${reveal}`,
      reveal!.replace('text: "Buy notebook"', 'text: "Buy notebook.*"'),
    )
    const movedAfterGate = flow.replace(
      `${reveal}\n${gate}`,
      `${gate}\n${reveal}`,
    )
    const notCentred = flow.replace(
      `${reveal}`,
      reveal!.replace("    centerElement: true\n", ""),
    )
    const notFullyVisible = flow.replace(
      `${reveal}`,
      reveal!.replace("    visibilityPercentage: 100\n", ""),
    )

    for (const mutation of [
      removed,
      widened,
      movedAfterGate,
      notCentred,
      notFullyVisible,
    ]) {
      expect(persistenceJourneyErrors(mutation)).not.toEqual([])
    }
  })

  it("rejects a weakened readiness gate or persistence round trip", () => {
    const widenedGate = flow.replace(exactReadinessGate, (gate) =>
      gate.replace('text: "Buy notebook"', 'text: "Buy notebook.*"'),
    )
    const removedReentry = flow.replace(
      /- stopApp\n- openLink: timecalendar-dev:\/\/calendar[\s\S]*?(?=- extendedWaitUntil:\n    visible: "Buy notebook")/,
      "",
    )
    const weakenedAbsence = flow.replace(
      'notVisible: "Buy notebook"',
      'notVisible: "Buy notebook.*"',
    )

    expect(persistenceJourneyErrors(widenedGate)).toContain(
      "exact readiness gate",
    )
    expect(persistenceJourneyErrors(removedReentry)).toContain(
      "ordered persistence round trip",
    )
    expect(persistenceJourneyErrors(weakenedAbsence)).toContain(
      "ordered persistence round trip",
    )
  })
})
