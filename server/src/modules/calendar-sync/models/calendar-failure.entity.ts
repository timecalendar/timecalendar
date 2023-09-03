import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity()
export class CalendarFailure {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  url: string

  @Column()
  error: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
