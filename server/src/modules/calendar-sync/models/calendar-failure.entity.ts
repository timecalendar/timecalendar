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

  @Column({ type: "varchar", nullable: true })
  schoolCode: string | null

  @Column()
  classification: string

  @Column()
  helpKey: string

  @Column()
  retryable: boolean

  @Column()
  errorKind: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
