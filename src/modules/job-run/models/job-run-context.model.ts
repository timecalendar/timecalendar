import { RunParams } from "modules/job-run/models/job-run-params.model"
import winston from "winston"

export interface JobRunContext<T = void> {
  params: RunParams<T>
  logger: winston.Logger
  progress: (number: number) => Promise<void>
}
