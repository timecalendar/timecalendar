import { startTelemetry } from "@lyrolab/nest-shared/observability"
import { OTEL_ENABLED } from "config/constants"
import { createNodeInstrumentations } from "./instrumentations"

// startTelemetry treats an unset OTEL_ENABLED as enabled; this service opts in.
const telemetry = OTEL_ENABLED
  ? startTelemetry({
      serviceName: "timecalendar",
      instrumentations: createNodeInstrumentations(),
    })
  : undefined

export const shutdownObservability = () =>
  telemetry?.shutdown() ?? Promise.resolve()
