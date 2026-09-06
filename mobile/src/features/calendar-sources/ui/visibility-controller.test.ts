import {
  reconcileVisibilityOperations,
  type VisibilityOperations,
  visibilityReducer,
  visibleFromOperation,
} from "./visibility-controller"

const pending = {
  id: 1,
  target: false,
  status: "pending" as const,
  startedAtCanonicalVersion: 0,
}

describe("visibilityReducer", () => {
  it("starts an id-keyed operation and exposes its target", () => {
    const state = visibilityReducer(
      {},
      {
        type: "start",
        calendarId: "cal-1",
        operation: pending,
      },
    )

    expect(state).toEqual({ "cal-1": pending })
    expect(visibleFromOperation(true, state["cal-1"])).toBe(false)
  })

  it("keeps a successful operation until canonical acknowledgement", () => {
    const started = { "cal-1": pending }
    const succeeded = visibilityReducer(started, {
      type: "succeed",
      calendarId: "cal-1",
      operationId: 1,
    })

    expect(succeeded["cal-1"]).toEqual({
      ...pending,
      status: "awaitingCanonical",
    })
    expect(
      reconcileVisibilityOperations(
        succeeded,
        [{ id: "cal-1", visible: false }],
        1,
      ),
    ).toEqual({})
  })

  it("releases a failed operation to the latest canonical value", () => {
    const failed = visibilityReducer(
      { "cal-1": pending },
      {
        type: "fail",
        calendarId: "cal-1",
        operationId: 1,
      },
    )

    expect(failed).toEqual({})
    expect(visibleFromOperation(true, failed["cal-1"])).toBe(true)
  })

  it("ignores stale success and failure completions", () => {
    const newest: VisibilityOperations = {
      "cal-1": {
        id: 2,
        target: true,
        status: "pending",
        startedAtCanonicalVersion: 1,
      },
    }

    expect(
      visibilityReducer(newest, {
        type: "succeed",
        calendarId: "cal-1",
        operationId: 1,
      }),
    ).toBe(newest)
    expect(
      visibilityReducer(newest, {
        type: "fail",
        calendarId: "cal-1",
        operationId: 1,
      }),
    ).toBe(newest)
  })

  it("leaves unrelated operations intact during reconciliation", () => {
    const state: VisibilityOperations = {
      "cal-1": pending,
      "cal-2": {
        id: 2,
        target: true,
        status: "awaitingCanonical",
        startedAtCanonicalVersion: 0,
      },
    }

    expect(
      reconcileVisibilityOperations(
        state,
        [
          { id: "cal-1", visible: true },
          { id: "cal-2", visible: true },
        ],
        1,
      ),
    ).toEqual({ "cal-1": pending })
    expect(
      reconcileVisibilityOperations(
        state,
        [
          { id: "cal-1", visible: true },
          { id: "cal-2", visible: false },
        ],
        0,
      ),
    ).toBe(state)
  })

  it("does not acknowledge equality that predates an operation", () => {
    const started: VisibilityOperations = {
      "cal-1": {
        id: 2,
        target: true,
        status: "pending",
        startedAtCanonicalVersion: 2,
      },
    }

    const staleEquality = reconcileVisibilityOperations(
      started,
      [{ id: "cal-1", visible: true }],
      2,
    )
    expect(staleEquality).toBe(started)

    const delayedPreviousEcho = reconcileVisibilityOperations(
      staleEquality,
      [{ id: "cal-1", visible: false }],
      3,
    )
    expect(delayedPreviousEcho).toBe(started)

    expect(
      reconcileVisibilityOperations(
        delayedPreviousEcho,
        [{ id: "cal-1", visible: true }],
        4,
      ),
    ).toEqual({})
  })

  it("acknowledges a coalesced target emission after the operation starts", () => {
    const started: VisibilityOperations = {
      "cal-1": {
        id: 2,
        target: true,
        status: "awaitingCanonical",
        startedAtCanonicalVersion: 2,
      },
    }

    expect(
      reconcileVisibilityOperations(
        started,
        [{ id: "cal-1", visible: true }],
        3,
      ),
    ).toEqual({})
  })
})
