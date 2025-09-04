import { plainToInstance } from "class-transformer"
import { Campus } from "modules/school/models/entities/campus.model"
import { School } from "modules/school/models/school.entity"
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from "typeorm"

@Entity()
export class SchoolProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("json", {
    transformer: {
      from: (value) => plainToInstance(Campus, value),
      to: (val) => val,
    },
    nullable: true,
  })
  campuses?: Campus[]

  @Column("json", { nullable: true })
  formations?: string[]

  @Column({ type: "text", nullable: true })
  description?: string

  @Column({ nullable: true })
  studentCount?: number

  @Column("json", { nullable: true })
  domains?: string[]

  @Column({ nullable: true })
  excellenceTitle?: string

  @Column({ type: "text", nullable: true })
  excellenceDescription?: string

  @Column("json", { nullable: true })
  tags?: string[]

  @Column({ type: "text", nullable: true })
  campusLocationContext?: string

  @OneToOne(() => School, { nullable: false })
  @JoinColumn()
  school: School

  @RelationId((schoolProfile: SchoolProfile) => schoolProfile.school)
  schoolId: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
