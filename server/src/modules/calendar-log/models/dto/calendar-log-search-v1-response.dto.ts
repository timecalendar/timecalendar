import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { CalendarLogV1 } from "modules/calendar-log/models/dto/calendar-log-v1.dto"

export class CalendarLogSearchV1Response {
  @ApiProperty({ type: () => CalendarLogV1, isArray: true })
  items: CalendarLogV1[]

  /** Opaque cursor for the next page, or `null` on the final page. */
  @ApiProperty({ type: String, nullable: true })
  nextCursor: string | null

  /** Snapshot watermark every page of this chain is bound to. */
  @ApiProperty({ type: Date })
  asOf: Date

  /** Present only on a request that carries `unreadSince` and no `cursor`. */
  @ApiPropertyOptional({ type: Number })
  unreadCount?: number
}
