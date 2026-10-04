import { act, render, screen } from "@testing-library/react-native"
import { useEffect } from "react"
import { Text } from "react-native"

import { createBootstrapStage } from "@/features/legacy-migration/data/bootstrap"

import { BootstrapGate } from "./bootstrap-gate"

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

it("orders schema, environment recovery, migration and every application consumer without timeout", async () => {
  jest.useFakeTimers()
  const order: string[] = []
  const schema = deferred(),
    environment = deferred(),
    migration = deferred()
  const initialize = (name: string, stage: ReturnType<typeof deferred>) =>
    createBootstrapStage(async () => {
      order.push(name)
      await stage.promise
    })
  function Consumers() {
    useEffect(() => {
      order.push(
        "routing",
        "changelog",
        "calendar-sync",
        "activity",
        "push",
        "ota",
        "outbox",
      )
    }, [])
    return <Text>App mounted</Text>
  }
  await render(
    <BootstrapGate initialize={initialize("schema", schema)}>
      <BootstrapGate initialize={initialize("environment", environment)}>
        <BootstrapGate initialize={initialize("migration", migration)}>
          <Consumers />
        </BootstrapGate>
      </BootstrapGate>
    </BootstrapGate>,
  )
  expect(order).toEqual(["schema"])
  await act(async () => {
    jest.advanceTimersByTime(60_000)
  })
  expect(screen.queryByText("App mounted")).toBeNull()
  await act(async () => {
    schema.resolve()
  })
  expect(order).toEqual(["schema", "environment"])
  await act(async () => {
    environment.resolve()
  })
  expect(order).toEqual(["schema", "environment", "migration"])
  await act(async () => {
    jest.advanceTimersByTime(60_000)
  })
  expect(screen.queryByText("App mounted")).toBeNull()
  await act(async () => {
    migration.resolve()
  })
  expect(order).toEqual([
    "schema",
    "environment",
    "migration",
    "routing",
    "changelog",
    "calendar-sync",
    "activity",
    "push",
    "ota",
    "outbox",
  ])
  jest.useRealTimers()
})

it("shares schema work across concurrent callers and rejects failed prerequisites", async () => {
  const work = deferred()
  const operation = jest.fn(() => work.promise)
  const initialize = createBootstrapStage(operation)
  const one = initialize(),
    two = initialize()
  expect(one).toBe(two)
  work.resolve()
  await one
  expect(operation).toHaveBeenCalledTimes(1)
  const failure = createBootstrapStage(async () => {
    throw new Error("failed")
  })
  await expect(failure()).rejects.toThrow("failed")
})
