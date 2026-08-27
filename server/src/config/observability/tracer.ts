import type { ClientRequest, IncomingMessage, RequestOptions } from "node:http"
import {
  Attributes,
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  Span,
} from "@opentelemetry/api"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs"
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"
import { NodeSDK, type NodeSDKConfiguration } from "@opentelemetry/sdk-node"
import {
  ATTR_SERVICE_NAME,
  SEMRESATTRS_SERVICE_INSTANCE_ID,
} from "@opentelemetry/semantic-conventions"
import { APP_STAGE, OTEL_ENABLED, OTEL_EXPORTER_URL } from "config/constants"
import { resolveServiceInstanceId } from "./service-instance"
import { classifyUpstreamDomain } from "./upstream-domain"

const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = "deployment.environment.name"
const DEFAULT_OTLP_ENDPOINT = "http://localhost:4317"
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 5_000

export type ObservabilityRuntimeConfig = {
  enabled: boolean
  endpoint?: string
  environment: string
  hostname?: string
}

type ExporterFactories = {
  trace: (url: string) => OTLPTraceExporter
  metric: (url: string) => OTLPMetricExporter
  log: (url: string) => OTLPLogExporter
}

const exporterFactories: ExporterFactories = {
  trace: (url) => new OTLPTraceExporter({ url }),
  metric: (url) => new OTLPMetricExporter({ url }),
  log: (url) => new OTLPLogExporter({ url }),
}

export const annotateOutgoingHttpSpan = (
  span: Pick<Span, "setAttribute">,
  request: Pick<ClientRequest, "host" | "protocol"> | RequestOptions,
) => {
  for (const [name, value] of Object.entries(
    sanitizedOutgoingHttpAttributes(request),
  )) {
    if (value !== undefined) span.setAttribute(name, value)
  }
}

export const sanitizedOutgoingHttpAttributes = (
  request: Pick<ClientRequest, "host" | "protocol"> | RequestOptions,
): Attributes => {
  const host = "hostname" in request ? request.hostname : request.host
  const protocol = request.protocol === "https:" ? "https:" : "http:"
  const upstream = classifyUpstreamDomain(`${protocol}//${host ?? ""}`)
  const safeUrl = `${protocol}//${upstream}/`

  return {
    // Override both legacy and stable HTTP semantic attributes before the span
    // starts. The instrumentation otherwise records the request-derived URL,
    // host, path, query, peer address, and user-agent by default.
    "http.url": safeUrl,
    "url.full": safeUrl,
    "http.target": "/",
    "url.path": "/",
    "url.query": "",
    "http.host": upstream,
    "net.peer.name": upstream,
    "net.peer.ip": "[redacted]",
    "server.address": upstream,
    "network.peer.address": "[redacted]",
    "http.user_agent": "[redacted]",
    "user_agent.original": "[redacted]",
    "peer.service": upstream,
    "upstream.domain": upstream,
  }
}

const isOutgoingHttpRequest = (
  request: ClientRequest | IncomingMessage,
): request is ClientRequest =>
  typeof (request as ClientRequest).getHeader === "function"

export const createNodeInstrumentations =
  (): NodeSDKConfiguration["instrumentations"] => [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-express": { enabled: false },
      // HTTP spans retain the bounded upstream. Lower-level connect spans expose
      // the original destination hostname and add no causal layer of their own.
      "@opentelemetry/instrumentation-net": { enabled: false },
      "@opentelemetry/instrumentation-http": {
        startOutgoingSpanHook: sanitizedOutgoingHttpAttributes,
        requestHook: (span, request) => {
          if (isOutgoingHttpRequest(request)) {
            annotateOutgoingHttpSpan(span, request)
          }
        },
        applyCustomAttributesOnSpan: (span, request) => {
          if (isOutgoingHttpRequest(request)) {
            annotateOutgoingHttpSpan(span, request)
          }
        },
      },
    }),
  ]

export const createObservabilitySdk = (
  runtime: ObservabilityRuntimeConfig,
  factories: ExporterFactories = exporterFactories,
): NodeSDK | undefined => {
  if (!runtime.enabled) return undefined

  const endpoint = runtime.endpoint || DEFAULT_OTLP_ENDPOINT
  return new NodeSDK({
    traceExporter: factories.trace(endpoint),
    metricReader: new PeriodicExportingMetricReader({
      exporter: factories.metric(endpoint),
    }),
    logRecordProcessors: [new BatchLogRecordProcessor(factories.log(endpoint))],
    instrumentations: createNodeInstrumentations(),
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: "timecalendar",
      [SEMRESATTRS_SERVICE_INSTANCE_ID]: resolveServiceInstanceId(
        runtime.hostname,
      ),
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: runtime.environment,
    }),
  })
}

export type ShutdownSdk = Pick<NodeSDK, "shutdown">

export const createBoundedSdkShutdown = (
  sdk: ShutdownSdk | undefined,
  timeoutMs = DEFAULT_SHUTDOWN_TIMEOUT_MS,
) => {
  let shutdown: Promise<void> | undefined

  return () => {
    if (!sdk) return Promise.resolve()
    if (shutdown) return shutdown

    const sdkShutdown = sdk.shutdown()
    let timer: ReturnType<typeof setTimeout>
    shutdown = Promise.race([
      sdkShutdown.finally(() => clearTimeout(timer)),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, timeoutMs)
        timer.unref?.()
      }),
    ])
    return shutdown
  }
}

const sdk = createObservabilitySdk({
  enabled: OTEL_ENABLED,
  endpoint: OTEL_EXPORTER_URL,
  environment: APP_STAGE,
  hostname: process.env.HOSTNAME,
})

if (sdk) {
  // OTel diagnostics deliberately stay on the console and never enter the
  // application logger, avoiding exporter/logger recursion.
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)
  sdk.start()
}

export const shutdownObservability = createBoundedSdkShutdown(sdk)

export default sdk
