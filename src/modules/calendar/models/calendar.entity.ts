import { CalendarCustomData } from "modules/fetch/models/calendar-source"
import { School } from "modules/school/models/school.entity"
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from "typeorm"

@Entity()
export class Calendar {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  name: string

  @Column({ nullable: true })
  schoolName: string | null

  @Column()
  url: string

  @Column("json", { nullable: true })
  customData: CalendarCustomData | null

  @ManyToOne(() => School, { nullable: true })
  school?: School

  @RelationId((calendar: Calendar) => calendar.school)
  schoolId: string

  @Column()
  lastUpdatedAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date
}
