import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { FeatureFlag } from "modules/feature-flag/models/entities/feature-flag.entity"
import { Repository } from "typeorm"

@Injectable()
export class FeatureFlagRepository {
  constructor(
    @InjectRepository(FeatureFlag)
    private readonly repository: Repository<FeatureFlag>,
  ) {}

  async findByKey(key: string): Promise<FeatureFlag | null> {
    return this.repository.findOne({ where: { key } })
  }
}
