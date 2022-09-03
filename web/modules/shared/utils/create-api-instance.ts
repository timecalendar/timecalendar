import { Configuration } from "@timecalendar/api-client"
import { BaseAPI } from "@timecalendar/api-client/dist/base"
import axios, { AxiosRequestConfig } from "axios"
import getConfig from "next/config"

const axiosConfig: AxiosRequestConfig = {}
const axiosInstance = axios.create()
const { publicRuntimeConfig } = getConfig()

export const createApiInstance = <T extends typeof BaseAPI>(
  BaseApi: T,
  headers?: Record<string, string>,
): InstanceType<T> => {
  const instance = new BaseApi(
    new Configuration({
      baseOptions: { ...axiosConfig, ...(headers ? { headers } : {}) },
    }),
    publicRuntimeConfig.mainApiUrl,
    axiosInstance as any,
  )

  return instance as InstanceType<T>
}
