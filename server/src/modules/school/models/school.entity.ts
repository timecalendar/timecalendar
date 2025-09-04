import { SchoolProfile } from "modules/school/models/entities/school-profile.entity"
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToOne,
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

  /**
   * The URL of the school landing page for SEO purposes
   */
  @Column({ type: "text", nullable: true })
  seoUrl?: string

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

  @OneToOne(() => SchoolProfile, (profile) => profile.school)
  profile?: SchoolProfile

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt?: Date
}
