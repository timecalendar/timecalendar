import { Injectable } from "@nestjs/common"
import { InjectStrategies } from "modules/fetch/decorators/inject-strategies"
import { CalendarSource } from "modules/fetch/models/calendar-source"
import genericStrategy from "modules/fetch/strategies/generic-strategy"
import { SchoolStrategy } from "modules/fetch/strategies/school-strategy"
import { notEmpty } from "modules/shared/utils/not-empty"

@Injectable()
export class FetchService {
  private readonly strategies: SchoolStrategy[]

  constructor(@InjectStrategies() strategies: SchoolStrategy[]) {
    this.strategies = [genericStrategy, ...strategies]
  }

  private getStrategy(school: string | null) {
    return this.strategies.find(
      (strategy) => strategy.options.school === school,
    )
  }

  private transformUrl(
    url: string,
    school: string | null,
    schoolStrategy: SchoolStrategy | undefined,
  ) {
    const strategiesUsedToTransformUrl: SchoolStrategy[] = [
      schoolStrategy?.options?.inheritGenericUrlRenamers !== false
        ? genericStrategy
        : null,
      ...(schoolStrategy ? [schoolStrategy] : this.strategies),
    ].filter(notEmpty)

    return strategiesUsedToTransformUrl.reduce(
      (acc, strategy) => strategy.transformUrl(acc, school),
      url,
    )
  }

  async fetchEvents(
    { url, customData }: CalendarSource,
    school: string | null,
    debugObject?: Record<string, any>,
  ) {
    const schoolStrategy = this.getStrategy(school)
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
