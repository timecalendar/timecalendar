import { Module } from "@nestjs/common"
import { CalendarSyncController } from "./controllers/calendar-sync.controller"

@Module({ controllers: [CalendarSyncController] })
export class CalendarSyncModule {}
