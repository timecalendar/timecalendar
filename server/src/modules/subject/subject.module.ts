import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CalendarSubject } from "modules/subject/models/calendar-subject.entity"
import { CalendarSubjectRepository } from "modules/subject/repositories/calendar-subject.repository"
import { SubjectService } from "modules/subject/services/subject.service"

@Module({
  imports: [TypeOrmModule.forFeature([CalendarSubject])],
  providers: [CalendarSubjectRepository, SubjectService],
  exports: [CalendarSubjectRepository, SubjectService],
})
export class SubjectModule {}
