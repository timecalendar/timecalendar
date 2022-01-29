import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { School } from "modules/school/models/school.entity"
import { SchoolController } from "modules/school/school.controller"
import { SchoolService } from "modules/school/services/school.service"

@Module({
  imports: [TypeOrmModule.forFeature([School])],
  providers: [SchoolService],
  controllers: [SchoolController],
  exports: [SchoolService],
})
export class SchoolModule {}
