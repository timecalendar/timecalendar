import { JobHandler } from "modules/job-run/models/job-handler.model"

export interface RunParams<T> {
  progress?: (progress: number) => Promise<void>
  name: string
  displayName?: string
  params?: any
  isCronjob?: boolean
  handler: JobHandler<T>
}
