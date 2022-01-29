import { CalendarCustomData } from "modules/fetch/models/calendar-custom-data"
import { School } from "modules/school/models/school.entity"
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity()
export class Calendar {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  @Index({ unique: true })
  token: string

  @Column()
  name: string

  @Column()
  schoolName: string

  @Column()
  url: string

  @Column("json")
  customData: CalendarCustomData

  @ManyToOne(() => School)
  school: School

  @Column()
  lastUpdatedAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date
}
