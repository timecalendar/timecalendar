import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { SchoolController } from "modules/school/controllers/school.controller"
import { SchoolMapper } from "modules/school/mappers/school.mapper"
import { SchoolProfile } from "modules/school/models/entities/school-profile.entity"
import { School } from "modules/school/models/school.entity"
import { SchoolRepository } from "modules/school/repositories/school.repository"
import { SchoolService } from "modules/school/services/school.service"

@Module({
  imports: [TypeOrmModule.forFeature([School, SchoolProfile])],
  providers: [SchoolService, SchoolRepository, SchoolMapper],
  controllers: [SchoolController],
  exports: [SchoolService, SchoolRepository],
})
export class SchoolModule {}
