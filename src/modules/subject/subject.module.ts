import { Module } from "@nestjs/common"
import { SubjectService } from "modules/subject/services/subject.service"

@Module({
  providers: [SubjectService],
  exports: [SubjectService],
})
export class SubjectModule {}
