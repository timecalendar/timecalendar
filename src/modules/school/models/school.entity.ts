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
  imageUrl: string

  @Column({ type: "varchar", nullable: true })
  intranetUrl: string | null

  @Column({ default: true })
  visible: boolean

  @Column()
  assistant: string

  @Column({ type: "varchar", nullable: true })
  fallbackAssistant: string | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date
}
