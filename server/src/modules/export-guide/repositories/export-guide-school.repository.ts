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

  findVisible(): Promise<Pick<School, "assistant">[]> {
    return this.schools.find({
      select: { assistant: true },
      where: { visible: true },
    })
  }
}
