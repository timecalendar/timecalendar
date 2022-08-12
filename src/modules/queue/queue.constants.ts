export const DEFAULT_QUEUE_NAME = "default"
export const DEFAULT_CRON_QUEUE_NAME = "default-cron"

export const APP_QUEUES = [DEFAULT_QUEUE_NAME, DEFAULT_CRON_QUEUE_NAME] as const

export type AppQueueName = typeof APP_QUEUES[number]
