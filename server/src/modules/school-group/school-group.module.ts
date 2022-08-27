import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { SchoolGroupController } from "modules/school-group/controllers/school-group.controller"
import { SchoolGroup } from "modules/school-group/models/school-group.entity"
import { SchoolGroupRepository } from "modules/school-group/repositories/school-group.repository"
import { SchoolGroupService } from "modules/school-group/services/school-group.service"

@Module({
  imports: [TypeOrmModule.forFeature([SchoolGroup])],
  providers: [SchoolGroupRepository, SchoolGroupService],
  controllers: [SchoolGroupController],
})
export class SchoolGroupModule {}
