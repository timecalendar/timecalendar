import { EventEmitter } from "node:events"
import { context, trace } from "@opentelemetry/api"
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks"
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  ReadableSpan,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base"
import { Request, Response } from "express"
import { CalendarRepository } from "modules/calendar/repositories/calendar.repository"
import { CalendarService } from "modules/calendar/services/calendar.service"
import { CalendarSyncController } from "./controllers/calendar-sync.controller"
import { withCalendarSyncSpan } from "./calendar-sync-tracing"
import { CalendarSyncAbortError } from "./models/calendar-sync-context"
import { CalendarSyncAllService } from "./services/calendar-sync-all.service"
import { CalendarSyncMetricsService } from "./services/calendar-sync-metrics.service"
import { CalendarSyncService } from "./services/calendar-sync.service"

type Outcome = "success" | "deadline" | "disconnect"

const endNanos = (span: ReadableSpan) =>
  BigInt(span.endTime[0]) * BigInt(1_000_000_000) + BigInt(span.endTime[1])

describe("calendar sync tracing", () => {
  afterEach(() => {
    trace.disable()
    context.disable()
  })

  it.each<Outcome>(["success", "deadline", "disconnect"])(
    "settles real %s request spans before the batch parent",
    async (outcome) => {
      const exporter = new InMemorySpanExporter()
      const provider = new BasicTracerProvider({
        spanProcessors: [new SimpleSpanProcessor(exporter)],
      })
      const contextManager = new AsyncLocalStorageContextManager().enable()
      context.setGlobalContextManager(contextManager)
      trace.setGlobalTracerProvider(provider)

      const request = new EventEmitter() as Request
      const response = new EventEmitter() as Response
      Object.defineProperty(response, "writableEnded", { value: false })
      const lastKnownContent = [{ id: "calendar", events: [] }]
      let requestSignal: AbortSignal | undefined
      let resolveSyncStarted!: () => void
      const syncStarted = new Promise<void>((resolve) => {
        resolveSyncStarted = resolve
      })
      const sync = jest.fn(
        async (_calendar: unknown, syncContext: { signal?: AbortSignal }) => {
          requestSignal = syncContext.signal
          resolveSyncStarted()
          await withCalendarSyncSpan(
            "calendar_sync.upstream_attempt",
            async () => {
              if (outcome === "success" || syncContext.signal?.aborted) return
              await new Promise<void>(
                (resolve) =>
                  syncContext.signal?.addEventListener(
                    "abort",
                    () => resolve(),
                    {
                      once: true,
                    },
                  ),
              )
            },
          )
        },
      )
      const calendarRepository = {
        findDueForSync: jest.fn(async () => [{ id: "calendar" }]),
        setCalendarsLastAccessedAt: jest.fn(async () => undefined),
      }
      const calendarService = {
        findCalendarsForPublic: jest.fn(async () => lastKnownContent),
      }
      const metrics = {
        measurePhase: jest.fn(
          async (_phase: string, work: () => Promise<unknown>) => work(),
        ),
        recordBatch: jest.fn(),
      }
      const allService = new CalendarSyncAllService(
        { sync } as unknown as CalendarSyncService,
        calendarRepository as unknown as CalendarRepository,
        calendarService as unknown as CalendarService,
        metrics as unknown as CalendarSyncMetricsService,
      )
      const controller = new CalendarSyncController(
        {} as CalendarSyncService,
        allService,
      )

      let fireDeadline: (() => void) | undefined
      const deadlineTimer =
        outcome === "deadline"
          ? jest.spyOn(global, "setTimeout").mockImplementationOnce(((
              callback: () => void,
            ) => {
              fireDeadline = callback
              return 0 as unknown as NodeJS.Timeout
            }) as typeof setTimeout)
          : undefined
      const operation = controller.syncCalendars(
        { tokens: ["token"] },
        request,
        response,
      )
      deadlineTimer?.mockRestore()
      if (outcome !== "success") await syncStarted
      if (outcome === "deadline") {
        fireDeadline?.()
      } else if (outcome === "disconnect") {
        response.emit("close")
      }

      await expect(operation).resolves.toBe(lastKnownContent)
      await provider.forceFlush()

      if (outcome !== "success") {
        expect(requestSignal?.reason).toEqual(
          new CalendarSyncAbortError(
            outcome === "deadline" ? "deadline" : "client_cancelled",
          ),
        )
      }
      expect(sync).toHaveBeenCalledTimes(1)
      const spans = exporter
        .getFinishedSpans()
        .filter((span) => span.name.startsWith("calendar_sync."))
      const batch = spans.find((span) => span.name === "calendar_sync.batch")
      expect(batch).toBeDefined()
      expect(spans.map((span) => span.name)).toEqual(
        expect.arrayContaining([
          "calendar_sync.candidate_selection",
          "calendar_sync.calendar_work",
          "calendar_sync.upstream_attempt",
          "calendar_sync.response_hydration",
        ]),
      )
      for (const span of spans.filter((span) => span !== batch)) {
        expect(span.spanContext().traceId).toBe(batch!.spanContext().traceId)
        expect(endNanos(span) <= endNanos(batch!)).toBe(true)
      }

      await provider.shutdown()
      contextManager.disable()
    },
  )
})
