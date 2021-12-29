import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity({ name: "schools" })
export class School {
  @PrimaryColumn()
  code: string

  @Column()
  name: string

  @Column({ name: "siteurl" })
  siteUrl: string

  @Column()
  visible: boolean

  @Column()
  assistant: string

  @Column({ name: "fallback_assistant", nullable: true })
  fallbackAssistant: string
}
