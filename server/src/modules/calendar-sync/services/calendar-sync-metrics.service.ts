import { Injectable } from "@nestjs/common"
import meter from "config/observability/meter"

@Injectable()
export class CalendarSyncMetricsService {
  calendarSyncCounter = meter.createCounter("calendar_sync_total", {
    // All labels are bounded to keep VictoriaMetrics cardinality finite:
    //   school     - school code slug (enum-like)
    //   domain     - upstream feed hostname (bounded by the count of providers)
    //   status     - "success" | "error"
    //   error_type - the exception's name/class (bounded; never the raw message)
    //   action     - "create" | "update"
    description:
      "Count of calendar syncs (all labels bounded for cardinality safety)",
    unit: "{requests}",
  })
}
