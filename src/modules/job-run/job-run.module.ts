import { Module } from "@nestjs/common"
import { JobRunService } from "modules/job-run/services/job-run.service"

@Module({
  providers: [JobRunService],
  exports: [JobRunService],
})
export class JobRunModule {}
