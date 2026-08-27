import { fork } from "node:child_process"
import { join } from "node:path"
import { SpanKind } from "@opentelemetry/api"

type SerializedSpan = {
  name: string
  kind: SpanKind
  attributes: Record<string, unknown>
  traceId: string
  spanId: string
  parentSpanId?: string
  endTimeNs: number
}

type TopologyProof = {
  error?: string
  statusCode: number
  failureMessage: string
  spans: SerializedSpan[]
}

const SYNTHETIC_TOKEN = "synthetic-calendar-token-never-export"

const runTopologyProof = () =>
  new Promise<TopologyProof>((resolve, reject) => {
    const child = fork(
      join(__dirname, "calendar-sync-telemetry.fixture.ts"),
      [],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          OTEL_ENABLED: "false",
          OTEL_LOGS_EXPORTER: "none",
          OTEL_METRICS_EXPORTER: "none",
        },
        execArgv: [
          "--require",
          "ts-node/register",
          "--require",
          "tsconfig-paths/register",
        ],
        silent: true,
      },
    )
    let stderr = ""
    let result: TopologyProof | undefined
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.once("message", (message: TopologyProof) => {
      result = message
    })
    child.once("error", reject)
    child.once("exit", (code) => {
      if (result?.error) return reject(new Error(result.error))
      if (!result || code !== 0) {
        return reject(
          new Error(
            `Topology fixture exited ${code ?? "without a code"}: ${stderr}`,
          ),
        )
      }
      resolve(result)
    })
  })

describe("calendar sync HTTP trace topology", () => {
  jest.setTimeout(20_000)

  it("uses production instrumentation and keeps every request child bounded", async () => {
    const proof = await runTopologyProof()
    expect(proof.statusCode).toBe(201)
    expect(proof.failureMessage).toBe("SyntheticUpstreamError")

    const successfulSync = proof.spans.find(
      (span) => span.name === "calendar.sync" && !span.attributes["error.type"],
    )
    const server = proof.spans.find(
      (span) =>
        span.kind === SpanKind.SERVER &&
        span.spanId === successfulSync?.parentSpanId,
    )
    expect(server).toBeDefined()
    expect(successfulSync).toMatchObject({
      parentSpanId: server?.spanId,
      attributes: {
        action: "create",
        school: "unknown",
        "upstream.domain": "ensea.fr",
      },
    })

    const descendants = proof.spans.filter(
      (span) => span.parentSpanId === successfulSync?.spanId,
    )
    expect(descendants.some((span) => span.kind === SpanKind.CLIENT)).toBe(true)
    expect(
      descendants.some(
        (span) =>
          span.attributes["db.system"] === "postgresql" ||
          span.attributes["db.system.name"] === "postgresql",
      ),
    ).toBe(true)
    const descendantIds = new Set([server!.spanId])
    let previousSize = 0
    while (descendantIds.size !== previousSize) {
      previousSize = descendantIds.size
      for (const span of proof.spans) {
        if (span.parentSpanId && descendantIds.has(span.parentSpanId)) {
          descendantIds.add(span.spanId)
        }
      }
    }
    expect(
      proof.spans
        .filter(
          (span) =>
            span.spanId !== server?.spanId && descendantIds.has(span.spanId),
        )
        .every((span) => span.endTimeNs <= server!.endTimeNs),
    ).toBe(true)
    expect(proof.spans.some((span) => span.name.startsWith("middleware"))).toBe(
      false,
    )

    const upstream = descendants.find(
      (span) =>
        span.kind === SpanKind.CLIENT &&
        span.attributes["upstream.domain"] === "ensea.fr",
    )
    expect(upstream?.attributes).toMatchObject({
      "http.url": "http://ensea.fr/",
      "url.full": "http://ensea.fr/",
      "http.target": "/",
      "url.path": "/",
      "url.query": "",
      "http.host": "ensea.fr",
      "net.peer.name": "ensea.fr",
      "server.address": "ensea.fr",
      "peer.service": "ensea.fr",
      "upstream.domain": "ensea.fr",
    })
    expect(JSON.stringify(proof.spans)).not.toMatch(
      new RegExp(`${SYNTHETIC_TOKEN}|ade\\.ensea\\.fr|/feed`),
    )

    const failedSync = proof.spans.find(
      (span) =>
        span.name === "calendar.sync" &&
        span.attributes["error.type"] === "Error",
    )
    expect(failedSync).toBeDefined()
  })
})
