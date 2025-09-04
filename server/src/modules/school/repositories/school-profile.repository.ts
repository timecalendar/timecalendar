import { Injectable } from "@nestjs/common"
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm"
import { SchoolProfile } from "modules/school/models/entities/school-profile.entity"
import { DataSource, Repository } from "typeorm"

@Injectable()
export class SchoolProfileRepository {
  constructor(
    @InjectRepository(SchoolProfile)
    private repository: Repository<SchoolProfile>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async findBySchoolId(schoolId: string): Promise<SchoolProfile | null> {
    return this.repository.findOne({
      where: { schoolId },
      relations: ["school"],
    })
  }

  async findOneOrFail(id: string): Promise<SchoolProfile> {
    return this.repository.findOneOrFail({
      where: { id },
      relations: ["school"],
    })
  }

  async upsertBySchoolId(
    schoolId: string,
    profileData: Partial<
      Omit<
        SchoolProfile,
        "id" | "schoolId" | "createdAt" | "updatedAt" | "school"
      >
    >,
  ): Promise<SchoolProfile> {
    return this.dataSource.transaction(async (manager) => {
      // Check if profile already exists
      const existingProfile = await manager.findOne(SchoolProfile, {
        where: { school: { id: schoolId } },
      })

      if (existingProfile) {
        // Update existing profile
        await manager.update(
          SchoolProfile,
          { school: { id: schoolId } },
          profileData,
        )
        return manager.findOneOrFail(SchoolProfile, {
          where: { school: { id: schoolId } },
          relations: ["school"],
        })
      } else {
        // Create new profile
        const newProfile = manager.create(SchoolProfile, {
          ...profileData,
          school: { id: schoolId },
        })
        await manager.save(newProfile)
        return manager.findOneOrFail(SchoolProfile, {
          where: { school: { id: schoolId } },
          relations: ["school"],
        })
      }
    })
  }

  async save(profile: SchoolProfile): Promise<SchoolProfile> {
    return this.repository.save(profile)
  }
}
