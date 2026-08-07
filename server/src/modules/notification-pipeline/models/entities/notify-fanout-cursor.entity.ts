import { Column, Entity, PrimaryColumn } from "typeorm"

export const NOTIFY_FANOUT_CURSOR_ID = 1

// One-row table: the global fan-out cursor over calendar_log(createdAt).
// Cursor advance and the outbox INSERT…SELECT commit in the same transaction.
@Entity("notify_fanout_cursor")
export class NotifyFanoutCursor {
  @PrimaryColumn("int")
  id: number

  @Column("timestamp")
  cursor: Date
}
