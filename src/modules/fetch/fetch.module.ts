import { Module } from "@nestjs/common"
import { FetchController } from "modules/fetch/controllers/fetch.controller"
import { FetchService } from "modules/fetch/services/fetch.service"
import { SCHOOL_STRATEGIES } from "./constants"
import strategies from "./schools/schools"

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
