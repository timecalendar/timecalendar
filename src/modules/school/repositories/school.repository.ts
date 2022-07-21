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

  findOne(id: string) {
    return this.repository.findOneBy({ id })
  }

  findAll() {
    return this.repository.findBy({ visible: true })
  }
}
