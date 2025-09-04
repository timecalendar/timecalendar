import { Configuration } from "@timecalendar/api-client"
import { BaseAPI } from "@timecalendar/api-client/dist/base"
import axios, { AxiosRequestConfig } from "axios"
import { env } from "next-runtime-env"

const axiosConfig: AxiosRequestConfig = {}
const axiosInstance = axios.create()

export const createApiInstance = <T extends typeof BaseAPI>(
  BaseApi: T,
  headers?: Record<string, string>,
): InstanceType<T> => {
  const instance = new BaseApi(
    new Configuration({
      baseOptions: { ...axiosConfig, ...(headers ? { headers } : {}) },
    }),
    env("NEXT_PUBLIC_BACKEND_URL"),
    axiosInstance,
  )

  return instance as InstanceType<T>
}
