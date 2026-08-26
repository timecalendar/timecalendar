import { Injectable } from "@nestjs/common"
import meter from "config/observability/meter"
import { CalendarImportDiagnostic } from "modules/calendar-sync/recovery/calendar-import-recovery"

export type CalendarSyncMetricAttributes = {
  school: string
  status: "success" | "error"
  classification?: CalendarImportDiagnostic["classification"]
  help_key?: CalendarImportDiagnostic["helpKey"]
  error_kind?: CalendarImportDiagnostic["errorKind"]
  action: "create" | "update"
}

@Injectable()
export class CalendarSyncMetricsService {
  private readonly counter = meter.createCounter("calendar_sync_total", {
    // All labels are bounded to keep VictoriaMetrics cardinality finite:
    //   school     - school code slug (enum-like)
    //   status     - "success" | "error"
    //   classification/help_key/error_kind - closed recovery values
    //   action     - "create" | "update"
    description: "Count of calendar syncs with bounded recovery labels",
    unit: "{requests}",
  })

  add(attributes: CalendarSyncMetricAttributes) {
    this.counter.add(1, attributes)
  }
}
