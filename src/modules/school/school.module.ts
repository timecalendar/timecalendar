import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { School } from "./models/school.entity"
import { SchoolController } from "./school.controller"
import { SchoolService } from "./school.service"

@Module({
  imports: [TypeOrmModule.forFeature([School])],
  providers: [SchoolService],
  controllers: [SchoolController],
})
export class SchoolModule {}
