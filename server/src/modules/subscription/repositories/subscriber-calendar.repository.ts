import { Injectable } from "@nestjs/common"
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm"
import { SubscriberCalendar } from "modules/subscription/models/subscriber-calendar.entity"
import { DataSource, Repository } from "typeorm"

type SaveForSubscriberParams = {
  subscriberId: string
  calendarIds: string[]
}

@Injectable()
export class SubscriberCalendarRepository {
  constructor(
    @InjectRepository(SubscriberCalendar)
    private repository: Repository<SubscriberCalendar>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async saveForSubscriber({
    subscriberId, // calendarIds,
  }: SaveForSubscriberParams) {
    await this.dataSource.transaction(async (entityManager) => {
      const repository = entityManager.getRepository(SubscriberCalendar)

      await repository.delete({ subscriberId })
      // await repository.
    })
  }
}
