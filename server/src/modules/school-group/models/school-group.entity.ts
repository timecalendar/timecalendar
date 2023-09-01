import { Type } from "class-transformer"
import { IsString, ValidateNested } from "class-validator"
import { SchoolGroupItem } from "modules/school-group/models/school-group-item"
import { School } from "modules/school/models/school.entity"
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm"

@Entity()
export class SchoolGroup {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @OneToOne(() => School)
  @JoinColumn()
  school: School

  @Column("json")
  @Type(() => SchoolGroupItem)
  @ValidateNested()
  groups: SchoolGroupItem[]

  @Column("text")
  @IsString()
  icalUrl: string
}
