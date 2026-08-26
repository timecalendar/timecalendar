import { ClientRequest } from "node:http"
import { diag, DiagConsoleLogger, DiagLogLevel, Span } from "@opentelemetry/api"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs"
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"
import { NodeSDK } from "@opentelemetry/sdk-node"
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
  request: Pick<ClientRequest, "host" | "protocol">,
) => {
  const upstream = classifyUpstreamDomain(
    `${request.protocol ?? "http:"}//${request.host}`,
  )
  span.setAttribute("peer.service", upstream)
  span.setAttribute("upstream.domain", upstream)
}

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
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
        "@opentelemetry/instrumentation-express": { enabled: false },
        "@opentelemetry/instrumentation-http": {
          requestHook: (span, request) => {
            if (request instanceof ClientRequest) {
              annotateOutgoingHttpSpan(span, request)
            }
          },
        },
      }),
    ],
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
