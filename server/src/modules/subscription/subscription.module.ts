import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { SubscriberCalendar } from "modules/subscription/models/subscriber-calendar.entity"
import { Subscriber } from "modules/subscription/models/subscriber.entity"
import { SubscriberRepository } from "modules/subscription/repositories/subscriber.repository"

@Module({
  imports: [TypeOrmModule.forFeature([Subscriber, SubscriberCalendar])],
  providers: [SubscriberRepository],
})
export class SubscriptionModule {}
