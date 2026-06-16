import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { SchoolController } from "modules/school/controllers/school.controller"
import { SchoolMapper } from "modules/school/mappers/school.mapper"
import { SchoolProfile } from "modules/school/models/entities/school-profile.entity"
import { School } from "modules/school/models/school.entity"
import { SchoolRepository } from "modules/school/repositories/school.repository"
import { SchoolProfileRepository } from "modules/school/repositories/school-profile.repository"
import { SchoolService } from "modules/school/services/school.service"
import { SchoolProfileGenerationService } from "modules/school/services/school-profile-generation.service"

@Module({
  imports: [TypeOrmModule.forFeature([School, SchoolProfile])],
  providers: [
    SchoolService,
    SchoolRepository,
    SchoolProfileRepository,
    SchoolProfileGenerationService,
    SchoolMapper,
  ],
  controllers: [SchoolController],
  exports: [
    SchoolService,
    // Exported for cross-module data access (calendar-sync, profile script).
    // Routing through a service method is a broader repository-pattern
    // refactor, deferred from this infra-adoption PR.
    // eslint-disable-next-line @lyrolab/nestjs-architecture/no-export-repository-in-module
    SchoolRepository,
    SchoolProfileGenerationService,
  ],
})
export class SchoolModule {}
