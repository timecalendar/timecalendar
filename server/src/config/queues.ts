import { QueueDefinition } from "@lyrolab/nest-shared/queue"
import { SYNC_QUEUE_CONCURRENCY } from "config/constants"

// Single source of truth for the queue roster: SharedQueueModule registration
// (app.module.ts), the job-events listeners, and Bull-Board all derive from it.
// "default" is the lib's built-in queue (nest-shared does not export its
// DEFAULT_QUEUE constant).
export const DEFAULT_QUEUE = "default"
export const SYNC_QUEUE = "sync"
export const NOTIFICATIONS_QUEUE = "notifications"

export const QUEUE_DEFINITIONS: QueueDefinition[] = [
  { name: SYNC_QUEUE, concurrency: SYNC_QUEUE_CONCURRENCY },
  { name: NOTIFICATIONS_QUEUE },
]

export const ALL_QUEUE_NAMES = [
  DEFAULT_QUEUE,
  ...QUEUE_DEFINITIONS.map(({ name }) => name),
]
