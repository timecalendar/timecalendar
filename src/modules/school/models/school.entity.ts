import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class School {
  @PrimaryColumn()
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
}
