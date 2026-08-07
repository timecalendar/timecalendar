import { JobsOptions } from "bullmq"
import { NotifyOptions } from "modules/firebase/models/notify-options.model"

export const SEND_PUSH_JOB = "send_push"

export type SendPushJobData = {
  subscriptionId: string
  token: string
  push: NotifyOptions
}

export const sendPushJobOptions: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 60_000 },
  removeOnComplete: true,
  removeOnFail: { age: 24 * 60 * 60 },
}
