import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { SubscriberType } from "modules/subscription/models/subscriber-type.enum"
import { Subscriber } from "modules/subscription/models/subscriber.entity"
import { Repository } from "typeorm"

type SaveParams = Pick<
  Subscriber,
  "email" | "firebaseToken" | "frequency" | "isEnabled" | "notificationDays"
> & { calendarIds: string[] }

@Injectable()
export class SubscriberRepository {
  constructor(
    @InjectRepository(Subscriber) private repository: Repository<Subscriber>,
  ) {}

  async save({
    calendarIds,
    email,
    firebaseToken,
    frequency,
    isEnabled,
    notificationDays,
  }: SaveParams) {
    const type = firebaseToken ? SubscriberType.FIREBASE : SubscriberType.EMAIL

    const existing = await this.findExistingByEmailOrFirebaseToken(
      email,
      firebaseToken,
    )

    const subscriberId = existing?.id
    return this.repository.save({
      id: subscriberId,
      type,
      email,
      firebaseToken,
      frequency,
      isEnabled,
      notificationDays,
      subscriberCalendars: calendarIds.map((calendarId) => ({ calendarId })),
    })
  }

  private async findExistingByEmailOrFirebaseToken(
    email: string | null,
    firebaseToken: string | null,
  ) {
    if (email) return this.repository.findOneBy({ email })
    if (firebaseToken) return this.repository.findOneBy({ firebaseToken })
    return null
  }
}
