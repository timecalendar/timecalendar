import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { School } from "modules/school/models/school.entity"
import { Repository } from "typeorm"

@Injectable()
export class ExportGuideSchoolRepository {
  constructor(
    @InjectRepository(School)
    private readonly schools: Repository<School>,
  ) {}

  findVisible(): Promise<School[]> {
    return this.schools.find({ where: { visible: true } })
  }
}
