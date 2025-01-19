import { Injectable } from "@nestjs/common"
import meter from "config/observability/meter"

@Injectable()
export class CalendarSyncMetricsService {
  calendarSyncCounter = meter.createCounter("calendar_sync_total", {
    description: "Count of calendar syncs",
    unit: "{requests}",
  })
}
