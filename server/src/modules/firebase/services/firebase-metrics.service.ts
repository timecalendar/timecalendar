import { Injectable } from "@nestjs/common"
import meter from "config/observability/meter"

@Injectable()
export class FirebaseMetricsService {
  pushNotificationsCounter = meter.createCounter(
    "push_notifications_sent_total",
    {
      // All labels are bounded to keep VictoriaMetrics cardinality finite:
      //   result - "success" | "invalid_token" | "failure"
      //   type   - the FCM payload `data.action` (enum-like; "calendar_changed" today)
      description:
        "Count of FCM push notifications sent (all labels bounded for cardinality safety)",
      unit: "{notifications}",
    },
  )
}
