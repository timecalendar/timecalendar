import { context, SpanKind, trace } from "@opentelemetry/api"
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks"
import { Body, Controller, Post } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base"
import { CalendarSyncService } from "modules/calendar-sync/services/calendar-sync.service"
import request from "supertest"

const SYNTHETIC_URL =
  "https://ade.ensea.fr/feed?token=synthetic-calendar-token-never-export"

@Controller("telemetry-sync")
class TelemetrySyncController {
  constructor(private readonly service: CalendarSyncService) {}

  @Post()
  sync(@Body() body: { url: string }) {
    return this.service.sync({
      url: body.url,
      customData: null,
      name: "Synthetic",
    })
  }
}

const endNs = ([seconds, nanos]: [number, number]) =>
  seconds * 1_000_000_000 + nanos

describe("calendar sync HTTP trace topology", () => {
  const exporter = new InMemorySpanExporter()
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  })
  const contextManager = new AsyncLocalStorageContextManager()
  const testTracer = provider.getTracer("calendar-sync-topology-test")
  let failFetch = false

  beforeAll(() => {
    trace.disable()
    context.disable()
    trace.setGlobalTracerProvider(provider)
    context.setGlobalContextManager(contextManager.enable())
  })

  afterAll(async () => {
    await provider.shutdown()
    contextManager.disable()
    trace.disable()
    context.disable()
  })

  beforeEach(() => {
    exporter.reset()
    failFetch = false
  })

  const inChildSpan = <T>(name: string, work: () => Promise<T>) =>
    testTracer.startActiveSpan(name, async (span) => {
      try {
        return await work()
      } finally {
        span.end()
      }
    })

  const createApp = async () => {
    const fetchService = {
      getMinSyncIntervalMinutes: () => 30,
      fetchEvents: () =>
        inChildSpan("HTTP GET", async () => {
          if (failFetch) throw new Error("SyntheticUpstreamError")
          return [{ fields: { canceled: false } }]
        }),
    }
    const calendarRepository = {
      save: jest.fn(async () => ({ id: "calendar-1" })),
      recordSyncAttempt: jest.fn(async () => undefined),
      findOne: jest.fn(async () => ({ id: "calendar-1" })),
    }
    const calendarContentRepository = {
      saveWithTransaction: jest.fn(
        async (_id, _content, callback: (manager: object) => Promise<void>) =>
          inChildSpan("postgres.query", () => callback({})),
      ),
    }
    const service = new CalendarSyncService(
      fetchService as never,
      { findOneOrFail: jest.fn() } as never,
      calendarRepository as never,
      calendarContentRepository as never,
      {
        fromFetcherCalendarEvent: jest.fn(() => ({ uid: "event-1" })),
      } as never,
      { syncEventSubjects: jest.fn(async () => undefined) } as never,
      { create: jest.fn(async () => undefined) } as never,
      { add: jest.fn() } as never,
      { detectAndLogChanges: jest.fn() } as never,
    )
    const module = await Test.createTestingModule({
      controllers: [TelemetrySyncController],
      providers: [{ provide: CalendarSyncService, useValue: service }],
    }).compile()
    const app = module.createNestApplication({ logger: false })
    app.use((_req, response, next) => {
      testTracer.startActiveSpan(
        "POST /telemetry-sync",
        { kind: SpanKind.SERVER },
        (span) => {
          response.once("finish", () => span.end())
          next()
        },
      )
    })
    await app.init()
    return { app, service }
  }

  it("contains awaited upstream/database work inside the HTTP server span", async () => {
    const { app } = await createApp()
    await request(app.getHttpServer())
      .post("/telemetry-sync")
      .send({ url: SYNTHETIC_URL })
      .expect(201)
    await provider.forceFlush()

    const spans = exporter.getFinishedSpans()
    const server = spans.find((span) => span.kind === SpanKind.SERVER)
    const sync = spans.find((span) => span.name === "calendar.sync")
    expect(server).toBeDefined()
    expect(sync?.parentSpanContext?.spanId).toBe(server?.spanContext().spanId)
    expect(sync?.attributes).toMatchObject({
      action: "create",
      school: "unknown",
      "upstream.domain": "ensea.fr",
    })
    expect(
      spans
        .filter((span) => ["HTTP GET", "postgres.query"].includes(span.name))
        .every(
          (span) =>
            span.parentSpanContext?.spanId === sync?.spanContext().spanId,
        ),
    ).toBe(true)
    expect(
      spans
        .filter(
          (span) =>
            span.spanContext().traceId === server?.spanContext().traceId,
        )
        .every((span) => endNs(span.endTime) <= endNs(server!.endTime)),
    ).toBe(true)
    expect(spans.some((span) => span.name.startsWith("middleware"))).toBe(false)
    expect(
      JSON.stringify(
        spans.map(({ name, attributes }) => ({ name, attributes })),
      ),
    ).not.toMatch(/synthetic-calendar-token-never-export|ade\.ensea\.fr\/feed/)
    await app.close()
  })

  it("ends the sync span and preserves the original failure", async () => {
    const { app, service } = await createApp()
    failFetch = true
    await expect(
      service.sync({ url: SYNTHETIC_URL, customData: null, name: "Synthetic" }),
    ).rejects.toThrow("SyntheticUpstreamError")
    await provider.forceFlush()

    const sync = exporter
      .getFinishedSpans()
      .find((span) => span.name === "calendar.sync")
    expect(sync?.attributes).toMatchObject({
      "error.type": "Error",
      "upstream.domain": "ensea.fr",
    })
    expect(sync?.duration).toBeDefined()
    await app.close()
  })
})
