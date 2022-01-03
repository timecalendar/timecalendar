import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity()
export class School {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  code: string

  @Column()
  name: string

  @Column()
  siteUrl: string

  @Column()
  visible: boolean

  @Column()
  assistant: string

  @Column({ nullable: true })
  fallbackAssistant: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date
}
