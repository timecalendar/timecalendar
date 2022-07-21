import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { School } from "modules/school/models/school.entity"

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private repository: Repository<School>,
  ) {}

  findAll() {
    return this.repository.findBy({ visible: true })
  }
}
