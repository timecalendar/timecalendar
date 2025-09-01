import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm"

@Entity()
export class FeatureFlag {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  key: string

  @Column()
  name: string

  @Column({ nullable: true })
  description: string

  @Column({ type: "boolean", default: false })
  enabled: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
