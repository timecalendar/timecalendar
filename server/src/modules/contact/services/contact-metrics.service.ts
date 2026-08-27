import { Injectable } from "@nestjs/common"
import meter from "config/observability/meter"
import type { CrispDeliveryStage } from "modules/contact/clients/crisp.client"

type ContactMetricAttributes =
  | { result: "success"; stage: "complete" }
  | { result: "error"; stage: CrispDeliveryStage }

@Injectable()
export class ContactMetricsService {
  private readonly counter = meter.createCounter("contact_submissions_total", {
    // Both labels are closed unions: at most eight combinations, with no
    // submitted content, user identity, session identifier, or vendor payload.
    description: "Count of contact submission outcomes by delivery stage",
    unit: "{submissions}",
  })

  add(attributes: ContactMetricAttributes) {
    this.counter.add(1, attributes)
  }
}
