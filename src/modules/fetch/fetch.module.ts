import { Module } from "@nestjs/common"
import { SCHOOL_STRATEGIES } from "modules/fetch/constants"
import { FetchController } from "modules/fetch/controllers/fetch.controller"
import strategies from "modules/fetch/schools/schools"
import { FetchService } from "modules/fetch/services/fetch.service"

@Module({
  providers: [
    {
      provide: SCHOOL_STRATEGIES,
      useValue: strategies,
    },
    FetchService,
  ],
  controllers: [FetchController],
})
export class FetchModule {}
