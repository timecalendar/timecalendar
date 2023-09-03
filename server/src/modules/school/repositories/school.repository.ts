import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { School } from "modules/school/models/school.entity"
import { Repository } from "typeorm"

@Injectable()
export class SchoolRepository {
  constructor(
    @InjectRepository(School)
    private repository: Repository<School>,
  ) {}

  findOneOrFail(id: string) {
    return this.repository.findOneByOrFail({ id })
  }

  findAll() {
    return this.repository.find({
      where: { visible: true },
      order: { name: "ASC" },
    })
  }
}
