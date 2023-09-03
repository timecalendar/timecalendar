import { BadRequestException } from "@nestjs/common"
import axios, { AxiosRequestConfig, AxiosResponse } from "axios"
import { Fetcher } from "modules/fetch/fetchers/fetcher"
import { CalendarCustomData } from "modules/fetch/models/calendar-source"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
import { parseIcal } from "modules/fetch/parsers/parse-ical"
import { CustomError } from "modules/shared/errors/custom-error"

export class IcalFetcher implements Fetcher {
  constructor(private readonly withRetries: boolean = false) {}

  async fetch(
    url: string,
    data?: CalendarCustomData,
  ): Promise<FetcherCalendarEvent[]> {
    // Some badly configured ADE instances do not return the ICal file
    // every time. Therefore, the request must be repeated several times
    // until the ICal file is obtained.
    const nbRetries = this.withRetries ? 15 : 1

    const axiosConfig: AxiosRequestConfig = {
      method: "get",
      url,
      maxRedirects: 99,
      timeout: 15000,
    }

    if (data?.auth) {
      axiosConfig.auth = data.auth
    }

    let rep: AxiosResponse<any> | undefined = undefined

    for (let i = 0; i < nbRetries; i++) {
      try {
        rep = await axios(axiosConfig)
      } catch (e) {
        if (e.response?.status === 401) {
          // handle HTTP basic authorization
          if (e.response.headers["www-authenticate"]) {
            if (data?.auth) {
              // Bad credentials
              throw new CustomError("Basic Authorization required", {
                basicAuth: "failed",
              })
            } else {
              throw new CustomError("Basic Authorization required", {
                auth: "basic",
              })
            }
          }
        }

        if (!this.withRetries) {
          throw new BadRequestException(
            `Failed to request the API: ${e.message}`,
          )
        }
      }
    }

    if (rep === undefined) {
      throw new BadRequestException(
        "The provider is unavailable, please try again.",
      )
    }

    return parseIcal(rep.data)
  }
}
