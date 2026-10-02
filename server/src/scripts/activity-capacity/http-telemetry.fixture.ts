import type { Server } from "node:net"
import { randomUUID } from "node:crypto"
import { NodeSDK } from "@opentelemetry/sdk-node"
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base"
import { createNodeInstrumentations } from "config/observability/tracer"

const listen = (server: Server) =>
  new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))

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
  const markers = {
    token: `token-${randomUUID()}`,
    calendar: randomUUID(),
    log: randomUUID(),
    cursor: Buffer.from(randomUUID()).toString("base64url"),
    content: `content-${randomUUID()}`,
  }
  const server = http.createServer((request, response) => {
    request.resume()
    request.once("end", () => {
      response.statusCode = 200
      response.setHeader("content-type", "application/json")
      response.end(
        '{"items":[],"nextCursor":null,"asOf":"2026-01-01T00:00:00.000Z"}',
      )
    })
  })
  await listen(server)

  const body = JSON.stringify({
    tokens: [markers.token],
    cursor: markers.cursor,
    fixture: {
      calendarId: markers.calendar,
      logId: markers.log,
      content: markers.content,
    },
  })
  await new Promise<void>((resolve, reject) => {
    const outgoing = http.request(
      {
        hostname: "127.0.0.1",
        port: portOf(server),
        path: "/v1/calendar-logs/search",
        method: "POST",
        headers: {
          "content-length": Buffer.byteLength(body),
          "content-type": "application/json",
        },
      },
      (response) => response.resume(),
    )
    outgoing.once("error", reject)
    outgoing.once("close", resolve)
    outgoing.end(body)
  })
  await new Promise((resolve) => setTimeout(resolve, 50))

  const serialized = JSON.stringify(
    exporter.getFinishedSpans().map((span) => ({
      name: span.name,
      kind: span.kind,
      attributes: span.attributes,
    })),
  )
  const categoryMatches = Object.fromEntries(
    Object.entries(markers).map(([category, marker]) => [
      category,
      serialized.includes(marker) ? 1 : 0,
    ]),
  )
  const spanCount = exporter.getFinishedSpans().length

  await close(server)
  process.send?.({ spanCount, categoryMatches })
  await sdk.shutdown()
}

run().catch((error) => {
  process.send?.({
    error:
      error instanceof Error ? error.stack ?? error.message : String(error),
  })
  process.exitCode = 1
})
