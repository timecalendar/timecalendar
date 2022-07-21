import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { School } from "modules/school/models/school.entity"
import { SchoolController } from "modules/school/controllers/school.controller"
import { SchoolService } from "modules/school/services/school.service"
import { SchoolRepository } from "modules/school/repositories/school.repository"

@Module({
  imports: [TypeOrmModule.forFeature([School])],
  providers: [SchoolService, SchoolRepository],
  controllers: [SchoolController],
  exports: [SchoolService, SchoolRepository],
})
export class SchoolModule {}
