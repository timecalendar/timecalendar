import { Injectable } from "@nestjs/common"
import meter from "config/observability/meter"
import { UpstreamDomain } from "config/observability/upstream-domain"

export type CalendarSyncMetricAttributes = {
  school: string
  domain: UpstreamDomain
  status: "success" | "error"
  error_type?: string
  action: "create" | "update"
}

@Injectable()
export class CalendarSyncMetricsService {
  private readonly counter = meter.createCounter("calendar_sync_total", {
    // All labels are bounded to keep VictoriaMetrics cardinality finite:
    //   school     - school code slug (enum-like)
    //   domain     - reviewed provider domain | "custom" | "invalid"
    //   status     - "success" | "error"
    //   error_type - the exception's name/class (bounded; never the raw message)
    //   action     - "create" | "update"
    description:
      "Count of calendar syncs (all labels bounded for cardinality safety)",
    unit: "{requests}",
  })

  add(attributes: CalendarSyncMetricAttributes) {
    this.counter.add(1, attributes)
  }
}
