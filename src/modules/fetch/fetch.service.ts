import { Injectable } from "@nestjs/common"
import { InjectStrategies } from "./decorators/inject-strategies"
import { CalendarCustomData } from "./models/calendar-custom-data"
import genericStrategy from "./strategies/generic-strategy"
import { SchoolStrategy } from "./strategies/school-strategy"

@Injectable()
export class FetchService {
  private readonly strategies: SchoolStrategy[]

  constructor(@InjectStrategies() strategies: SchoolStrategy[]) {
    this.strategies = [genericStrategy, ...strategies]
  }

  private getStrategy(school: string) {
    return (
      this.strategies.find((strategy) => strategy.options.school === school) ??
      genericStrategy
    )
  }

  transformUrl(url: string, school: string) {
    return this.strategies.reduce(
      (acc, strategy) => strategy.transformUrl(acc, school),
      url,
    )
  }

  async fetchEvents(url: string, school: string, data?: CalendarCustomData) {
    const strategy = this.getStrategy(school)

    // Transform the URL
    const transformedUrl = this.transformUrl(url, school)

    // Fetch events
    const rawEvents = await strategy.fetchEvents(transformedUrl, data)

    // Format events
    const events = strategy.transformEvents(rawEvents)

    return events.filter((event) => !event.fields.canceled)
  }
}
