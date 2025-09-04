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

  /**
   * The exhaustive list of campuses of the school
   * @example [{ name: "Campus de Nanterre", location: "Nanterre (principal)" }, { name: "Campus Ville-d'Avray", location: "Ville-d'Avray" }]
   */
  @Column("json", {
    transformer: {
      from: (value) => plainToInstance(Campus, value),
      to: (val) => val,
    },
    nullable: true,
  })
  campuses?: Campus[]

  /**
   * The formations the school is known for
   * If should contain maximum 6 formations
   * @example ["Licence Droit", "Licence Économie", "Master Lettres Modernes", "Master Sciences Politiques", "Licence Psychologie", "Master Droit Public"]
   */
  @Column("json", { nullable: true })
  formations?: string[]

  /**
   * The description of the school
   * @example "L'université My Gaming Academia est une université de gaming et de technologie."
   */
  @Column({ type: "text", nullable: true })
  description?: string

  /**
   * The number of students the school has
   * @example 10000
   */
  @Column({ nullable: true })
  studentCount?: number

  /**
   * The domains of study the school is known for
   * If should contain maximum 5 domains
   * @example ["Informatique", "Electronique", "Marketing Digital"]
   */
  @Column("json", { nullable: true })
  domains?: string[]

  /**
   * The title of the excellence of the school
   * @example "Excellence en Informatique"
   */
  @Column({ nullable: true })
  excellenceTitle?: string

  /**
   * A paragraph explaining why the school is known for the domains
   * @example "L'université My Gaming Academia est connue pour son excellence en informatique et en électronique."
   */
  @Column({ type: "text", nullable: true })
  excellenceDescription?: string

  /**
   * The tags of the school
   * @example ["Engagement citoyen", "Ouverture internationale", "Recherche avancée", "Campus innovant"]
   */
  @Column("json", { nullable: true })
  tags?: string[]

  /**
   * The region where the school is located
   * @example "Île-de-France"
   */
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
