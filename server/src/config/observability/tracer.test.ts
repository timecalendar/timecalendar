import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { SEMRESATTRS_SERVICE_INSTANCE_ID } from "@opentelemetry/semantic-conventions"
import {
  annotateOutgoingHttpSpan,
  createBoundedSdkShutdown,
  createObservabilitySdk,
} from "./tracer"

describe("observability SDK configuration", () => {
  it("does not create exporters when telemetry is disabled", () => {
    const factories = {
      trace: jest.fn(),
      metric: jest.fn(),
      log: jest.fn(),
    }
    expect(
      createObservabilitySdk(
        { enabled: false, environment: "test", hostname: "pod-1" },
        factories,
      ),
    ).toBeUndefined()
    expect(factories.trace).not.toHaveBeenCalled()
    expect(factories.metric).not.toHaveBeenCalled()
    expect(factories.log).not.toHaveBeenCalled()
  })

  it("shares the endpoint and sanitized resource across all signals", () => {
    const trace = jest.fn((url: string) => new OTLPTraceExporter({ url }))
    const metric = jest.fn((url: string) => new OTLPMetricExporter({ url }))
    const log = jest.fn((url: string) => new OTLPLogExporter({ url }))

    const sdk = createObservabilitySdk(
      {
        enabled: true,
        endpoint: "http://collector:4317",
        environment: "preprod",
        hostname: "pod/name",
      },
      { trace, metric, log },
    )

    expect(trace).toHaveBeenCalledWith("http://collector:4317")
    expect(metric).toHaveBeenCalledWith("http://collector:4317")
    expect(log).toHaveBeenCalledWith("http://collector:4317")
    expect(
      (sdk as unknown as { _resource: { attributes: Record<string, string> } })
        ._resource.attributes,
    ).toMatchObject({
      "service.name": "timecalendar",
      [SEMRESATTRS_SERVICE_INSTANCE_ID]: "unknown",
      "deployment.environment.name": "preprod",
    })
  })

  it.each([
    ["ade.ensea.fr", "ensea.fr"],
    ["calendar.example.test", "custom"],
    ["127.0.0.1", "invalid"],
  ])("adds only the bounded upstream for %s", (host, expected) => {
    const setAttribute = jest.fn()
    annotateOutgoingHttpSpan({ setAttribute }, {
      host,
      protocol: "https:",
    } as never)
    expect(setAttribute.mock.calls).toEqual([
      ["peer.service", expected],
      ["upstream.domain", expected],
    ])
  })
})

describe("bounded SDK shutdown", () => {
  it("is idempotent", async () => {
    const sdk = { shutdown: jest.fn(() => Promise.resolve()) }
    const shutdown = createBoundedSdkShutdown(sdk)
    await Promise.all([shutdown(), shutdown()])
    expect(sdk.shutdown).toHaveBeenCalledTimes(1)
  })

  it("is a no-op when telemetry is disabled", async () => {
    await expect(createBoundedSdkShutdown(undefined)()).resolves.toBeUndefined()
  })

  it("does not wait forever for an exporter", async () => {
    jest.useFakeTimers()
    const shutdown = createBoundedSdkShutdown(
      { shutdown: jest.fn(() => new Promise(() => undefined)) },
      10,
    )
    const result = shutdown()
    await jest.advanceTimersByTimeAsync(10)
    await expect(result).resolves.toBeUndefined()
    jest.useRealTimers()
  })
})
