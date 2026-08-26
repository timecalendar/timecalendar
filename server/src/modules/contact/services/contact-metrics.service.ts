import { Injectable } from "@nestjs/common"
import meter from "config/observability/meter"

@Injectable()
export class ContactMetricsService {
  contactSubmissionsCounter = meter.createCounter("contact_submissions_total", {
    // Both labels are closed unions: at most eight combinations, with no
    // submitted content, user identity, session identifier, or vendor payload.
    description: "Count of contact submission outcomes by delivery stage",
    unit: "{submissions}",
  })
}
