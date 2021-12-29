import { Module } from "@nestjs/common"
import { SCHOOL_STRATEGIES } from "./constants"
import { FetchController } from "./fetch.controller"
import { FetchService } from "./fetch.service"
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
