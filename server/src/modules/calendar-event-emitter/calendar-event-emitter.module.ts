import { Module } from "@nestjs/common"
import { CalendarContentEventEmitter } from "modules/calendar-event-emitter/events/calendar-content.event-emitter"

@Module({
  providers: [CalendarContentEventEmitter],
  exports: [CalendarContentEventEmitter],
})
export class CalendarEventEmitterModule {}
