import { Injectable } from "@nestjs/common"
import meter from "config/observability/meter"

@Injectable()
export class CalendarSyncMetricsService {
  calendarSyncCounter = meter.createCounter("calendar_sync_total", {
    // All labels are bounded to keep VictoriaMetrics cardinality finite:
    //   school     - school code slug (enum-like)
    //   status     - "success" | "error"
    //   classification/help_key/error_kind - closed recovery values
    //   action     - "create" | "update"
    description: "Count of calendar syncs with bounded recovery labels",
    unit: "{requests}",
  })
}
