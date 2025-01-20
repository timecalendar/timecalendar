import { BadRequestException } from "@nestjs/common"
import axios, { AxiosError, AxiosRequestConfig } from "axios"
import { Fetcher } from "modules/fetch/fetchers/fetcher"
import { CalendarCustomData } from "modules/fetch/models/calendar-source"
import { FetcherCalendarEvent } from "modules/fetch/models/event.model"
import { parseIcal } from "modules/fetch/parsers/parse-ical"
import { CustomError } from "modules/shared/errors/custom-error"
import { HttpsProxyAgent } from "https-proxy-agent"
import { PROXY_URL } from "config/constants"

type IcalFetcherOptions = {
  withRetries?: boolean
  useProxy?: boolean
}

const defaultOptions: IcalFetcherOptions = {
  withRetries: false,
  useProxy: false,
}

export class IcalFetcher implements Fetcher {
  constructor(private readonly options: IcalFetcherOptions = defaultOptions) {}

  async fetch(
    url: string,
    data?: CalendarCustomData,
  ): Promise<FetcherCalendarEvent[]> {
    // Some badly configured ADE instances do not return the ICal file
    // every time. Therefore, the request must be repeated several times
    // until the ICal file is obtained.
    const nbRetries = this.options.withRetries ? 15 : 1

    const axiosConfig: AxiosRequestConfig = {
      method: "get",
      url,
      maxRedirects: 99,
      timeout: 10000,
    }

    if (this.options.useProxy && PROXY_URL.length > 0) {
      const httpsAgent = new HttpsProxyAgent(PROXY_URL)
      axiosConfig.httpsAgent = httpsAgent
    }

    if (data?.auth) {
      axiosConfig.auth = data.auth
    }

    let lastError: unknown

    for (let i = 0; i < nbRetries; i++) {
      try {
        const rep = await axios.request(axiosConfig)

        return parseIcal(rep.data)
      } catch (error: unknown) {
        lastError = error

        if (error instanceof AxiosError && error.response?.status === 401) {
          // handle HTTP basic authorization
          if (error.response.headers["www-authenticate"]) {
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
      }
    }

    throw new BadRequestException(
      `Failed to request the API: ${
        lastError instanceof Error ? lastError.message : lastError
      }`,
    )
  }
}
