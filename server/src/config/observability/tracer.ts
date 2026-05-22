import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions"
import { APP_STAGE, OTEL_ENABLED, OTEL_EXPORTER_URL } from "config/constants"

// `deployment.environment.name` is an OTel *incubating* semantic convention.
// Its package export lives under the `/incubating` subpath, which only
// resolves with `moduleResolution` node16+; the server still uses classic
// resolution, so the (stable) attribute key is inlined here.
const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = "deployment.environment.name"

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: OTEL_EXPORTER_URL || "http://localhost:4317",
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: OTEL_EXPORTER_URL || "http://localhost:4317",
    }),
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": {
        enabled: false,
      },
      "@opentelemetry/instrumentation-express": {
        ignoreLayers: ["/ws"],
      },
    }),
  ],
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "timecalendar",
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: APP_STAGE,
  }),
})

if (OTEL_ENABLED) {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)
  sdk.start()
}

export default sdk
