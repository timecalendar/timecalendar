import { BeforeApplicationShutdown, Injectable } from "@nestjs/common"
import { shutdownObservability } from "./tracer"

@Injectable()
export class ObservabilityLifecycleService
  implements BeforeApplicationShutdown
{
  beforeApplicationShutdown() {
    return shutdownObservability()
  }
}
