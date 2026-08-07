import { Module } from "@nestjs/common"
import { JobEventsListenerService } from "modules/job-run/services/job-events-listener.service"

@Module({
  providers: [JobEventsListenerService],
})
export class JobRunModule {}
