import { context, trace } from "@opentelemetry/api"
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks"
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base"
import { withCalendarSyncSpan } from "./calendar-sync-tracing"

describe("calendar sync tracing", () => {
  afterAll(() => {
    trace.disable()
    context.disable()
  })

  it.each(["success", "deadline", "disconnect"])(
    "ends every %s child before its awaited parent",
    async (outcome) => {
      const exporter = new InMemorySpanExporter()
      const provider = new BasicTracerProvider({
        spanProcessors: [new SimpleSpanProcessor(exporter)],
      })
      trace.disable()
      context.disable()
      const contextManager = new AsyncLocalStorageContextManager().enable()
      context.setGlobalContextManager(contextManager)
      trace.setGlobalTracerProvider(provider)

      await withCalendarSyncSpan(`batch.${outcome}`, async () => {
        await withCalendarSyncSpan(
          `selection.${outcome}`,
          async () => undefined,
        )
        await withCalendarSyncSpan(`calendar.${outcome}`, async () => {
          await Promise.resolve()
        })
        await withCalendarSyncSpan(`response.${outcome}`, async () => undefined)
      })
      await provider.forceFlush()

      const spans = exporter.getFinishedSpans()
      const parent = spans.find((span) => span.name === `batch.${outcome}`)
      expect(parent).toBeDefined()
      for (const child of spans.filter((span) => span !== parent)) {
        expect(child.parentSpanContext?.spanId).toBe(
          parent!.spanContext().spanId,
        )
        expect(child.endTime).toBeDefined()
        const childEnd =
          BigInt(child.endTime[0]) * BigInt(1_000_000_000) +
          BigInt(child.endTime[1])
        const parentEnd =
          BigInt(parent!.endTime[0]) * BigInt(1_000_000_000) +
          BigInt(parent!.endTime[1])
        expect(childEnd <= parentEnd).toBe(true)
      }
      await provider.shutdown()
      contextManager.disable()
    },
  )
})
