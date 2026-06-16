import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CalendarSubject } from "modules/subject/models/calendar-subject.entity"
import { CalendarSubjectRepository } from "modules/subject/repositories/calendar-subject.repository"
import { SubjectService } from "modules/subject/services/subject.service"

@Module({
  imports: [TypeOrmModule.forFeature([CalendarSubject])],
  providers: [CalendarSubjectRepository, SubjectService],
  exports: [
    // Exported for cross-module data access (calendar.service). Routing
    // through a service method is a broader repository-pattern refactor,
    // deferred from this infra-adoption PR.
    // eslint-disable-next-line @lyrolab/nestjs-architecture/no-export-repository-in-module
    CalendarSubjectRepository,
    SubjectService,
  ],
})
export class SubjectModule {}
