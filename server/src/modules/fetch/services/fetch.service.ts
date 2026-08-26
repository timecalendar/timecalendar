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

  private getStrategy(school: string | null, calendarSource: CalendarSource) {
    return this.strategies.find((strategy) =>
      strategy.isMatchingCalendarSource(school, calendarSource),
    )
  }

  private transformUrl(
    url: string,
    school: string | null,
    schoolStrategy: SchoolStrategy | undefined,
  ) {
    // A calendar that matched no school strategy runs through every registered
    // school's renamers after the generic strategy. Registering a strategy for a
    // school therefore turns the other school renamers off for it — see
    // univlyon1-strategy.ts, where that was a real behaviour change.
    let strategiesUsedToTransformUrl = this.strategies
    if (schoolStrategy) {
      strategiesUsedToTransformUrl =
        schoolStrategy === genericStrategy ||
        schoolStrategy.options.inheritGenericUrlRenamers === false
          ? [schoolStrategy]
          : [genericStrategy, schoolStrategy]
    }

    return strategiesUsedToTransformUrl.reduce(
      (acc, strategy) => strategy.transformUrl(acc, school),
      url,
    )
  }

  /**
   * Minimum number of minutes between two upstream fetches of this calendar,
   * as declared by the strategy the calendar resolves to.
   */
  getMinSyncIntervalMinutes(
    calendarSource: CalendarSource,
    school: string | null,
  ) {
    const strategy = this.getStrategy(school, calendarSource) ?? genericStrategy
    return strategy.options.minSyncIntervalMinutes
  }

  async fetchEvents(
    calendarSource: CalendarSource,
    school: string | null,
    debugObject?: Record<string, any>,
  ) {
    const { url, customData } = calendarSource

    const schoolStrategy = this.getStrategy(school, calendarSource)
    const transformedUrl = this.transformUrl(url, school, schoolStrategy)
    const strategy = schoolStrategy || genericStrategy

    if (debugObject) {
      debugObject.transformedUrl = transformedUrl
      debugObject.strategy = schoolStrategy?.options.school || null
    }

    const rawEvents = await strategy.fetchEvents(transformedUrl, customData)
    const events = strategy.transformEvents(rawEvents)
    return events.filter((event) => !event.fields.canceled)
  }
}
