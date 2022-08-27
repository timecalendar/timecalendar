import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { SchoolGroup } from "modules/school-group/models/school-group.entity"
import { idToEntity } from "modules/shared/utils/typeorm/id-to-entity"
import { Repository } from "typeorm"

@Injectable()
export class SchoolGroupRepository {
  constructor(
    @InjectRepository(SchoolGroup)
    private repository: Repository<SchoolGroup>,
  ) {}

  findOne(schoolId: string) {
    return this.repository.findOneByOrFail({ school: { id: schoolId } })
  }

  async save(schoolId: string, data: Pick<SchoolGroup, "groups" | "icalUrl">) {
    const existing = await this.repository.findOneBy({
      school: idToEntity(schoolId),
    })
    const schoolGroupId = existing?.id
    return this.repository.save({
      id: schoolGroupId,
      ...(!schoolGroupId && { school: { id: schoolId } }),
      ...data,
    })
  }
}
