import type { Server } from "node:net"
import { NodeSDK } from "@opentelemetry/sdk-node"
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base"
import { createNodeInstrumentations } from "./tracer"

const SYNTHETIC_TOKEN = "synthetic-calendar-token-never-export"

const listen = (server: Server) =>
  new Promise<void>((resolve) => server.listen(0, resolve))

const close = (server: Server) =>
  new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )

const portOf = (server: Server) => {
  const address = server.address()
  if (!address || typeof address === "string") {
    throw new Error("Synthetic server did not bind a TCP port")
  }
  return address.port
}

async function run() {
  const exporter = new InMemorySpanExporter()
  const sdk = new NodeSDK({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
    instrumentations: createNodeInstrumentations(),
  })
  sdk.start()

  const http = await import("node:http")
  const net = await import("node:net")
  const { Client } = await import("pg")
  const { CalendarSyncService } = await import(
    "modules/calendar-sync/services/calendar-sync.service"
  )
  const upstreamServer = net.createServer((socket) => {
    socket.once("data", () => {
      socket.end(
        "HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\n[]",
      )
    })
  })
  await listen(upstreamServer)
  const syntheticUrl = `http://ade.ensea.fr:${portOf(
    upstreamServer,
  )}/feed?token=${SYNTHETIC_TOKEN}`

  const fetchThroughInstrumentedHttp = (url: string) =>
    new Promise<void>((resolve, reject) => {
      const parsed = new URL(url)
      const outgoing = http.get(
        {
          hostname: parsed.hostname,
          port: parsed.port,
          path: `${parsed.pathname}${parsed.search}`,
          lookup: (_hostname, options, callback) => {
            if (options.all) {
              callback(null, [{ address: "127.0.0.1", family: 4 }])
            } else {
              callback(null, "127.0.0.1", 4)
            }
          },
        },
        (response) => response.resume(),
      )
      outgoing.once("error", reject)
      outgoing.once("close", resolve)
    })

  const runInstrumentedDatabaseQuery = async () => {
    const client = new Client()
    await client.end()
    await client.query("SELECT 1").catch(() => undefined)
  }

  let failFetch = false
  const service = new CalendarSyncService(
    {
      getMinSyncIntervalMinutes: () => 30,
      fetchEvents: async (source: { url: string }) => {
        if (failFetch) throw new Error("SyntheticUpstreamError")
        await fetchThroughInstrumentedHttp(source.url)
        return [{ fields: { canceled: false } }]
      },
    } as never,
    { findOneOrFail: async () => undefined } as never,
    {
      save: async () => ({ id: "calendar-1" }),
      recordSyncAttempt: async () => undefined,
      findOne: async () => ({ id: "calendar-1" }),
    } as never,
    {
      saveWithTransaction: async (
        _id: string,
        _content: object,
        callback: (manager: object) => Promise<void>,
      ) => {
        await runInstrumentedDatabaseQuery()
        return callback({})
      },
    } as never,
    { fromFetcherCalendarEvent: () => ({ uid: "event-1" }) } as never,
    { syncEventSubjects: async () => undefined } as never,
    { create: async () => undefined } as never,
    { add: () => undefined } as never,
    { detectAndLogChanges: () => undefined } as never,
  )

  const syncServer = http.createServer((incoming, response) => {
    const chunks: Buffer[] = []
    incoming.on("data", (chunk: Buffer) => chunks.push(chunk))
    incoming.on("end", () => {
      const body = JSON.parse(Buffer.concat(chunks).toString()) as {
        url: string
      }
      service
        .sync({ url: body.url, customData: null, name: "Synthetic" })
        .then(() => {
          response.statusCode = 201
          response.end()
        })
        .catch(() => {
          response.statusCode = 500
          response.end()
        })
    })
  })
  await listen(syncServer)

  const statusCode = await new Promise<number>((resolve, reject) => {
    const body = JSON.stringify({ url: syntheticUrl })
    let status = 0
    const outgoing = http.request(
      {
        hostname: "127.0.0.1",
        port: portOf(syncServer),
        path: "/telemetry-sync",
        method: "POST",
        headers: {
          "content-length": Buffer.byteLength(body),
          "content-type": "application/json",
        },
      },
      (response) => {
        status = response.statusCode ?? 0
        response.resume()
      },
    )
    outgoing.once("error", reject)
    outgoing.once("close", () => resolve(status))
    outgoing.end(body)
  })
  await new Promise((resolve) => setTimeout(resolve, 100))

  failFetch = true
  let failureMessage = ""
  try {
    await service.sync({
      url: syntheticUrl,
      customData: null,
      name: "Synthetic",
    })
  } catch (error) {
    failureMessage = error instanceof Error ? error.message : String(error)
  }
  await new Promise((resolve) => setTimeout(resolve, 100))

  const spans = exporter.getFinishedSpans().map((span) => ({
    name: span.name,
    kind: span.kind,
    attributes: span.attributes,
    traceId: span.spanContext().traceId,
    spanId: span.spanContext().spanId,
    parentSpanId: span.parentSpanContext?.spanId,
    endTimeNs: span.endTime[0] * 1_000_000_000 + span.endTime[1],
  }))

  await close(syncServer)
  await close(upstreamServer)
  process.send?.({ statusCode, failureMessage, spans })
  await sdk.shutdown()
}

run().catch((error) => {
  process.send?.({
    error:
      error instanceof Error ? error.stack ?? error.message : String(error),
  })
  process.exitCode = 1
})
