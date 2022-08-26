import { Injectable } from "@nestjs/common"
import { InjectStrategies } from "modules/fetch/decorators/inject-strategies"
import { CalendarSource } from "modules/fetch/models/calendar-source"
import genericStrategy from "modules/fetch/strategies/generic-strategy"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"

@Injectable()
export class FetchService {
  private readonly strategies: SchoolStrategy[]

  constructor(@InjectStrategies() strategies: SchoolStrategy[]) {
    this.strategies = [genericStrategy, ...strategies]
  }

  private getStrategy(school: string | null) {
    return (
      this.strategies.find((strategy) => strategy.options.school === school) ??
      genericStrategy
    )
  }

  transformUrl(url: string, school: string | null) {
    return this.strategies.reduce(
      (acc, strategy) => strategy.transformUrl(acc, school),
      url,
    )
  }

  async fetchEvents(
    { url, customData }: CalendarSource,
    school: string | null,
  ) {
    const strategy = this.getStrategy(school)
    const transformedUrl = this.transformUrl(url, school)
    const rawEvents = await strategy.fetchEvents(transformedUrl, customData)
    const events = strategy.transformEvents(rawEvents)
    return events.filter((event) => !event.fields.canceled)
  }
}
