import type { MigrationRepository } from "@/db/legacy-migration"

export interface OutboxDependencies {
  repository: MigrationRepository
  eligible: () => boolean
  now: () => Date
  send: (payload: string) => Promise<number>
}

export function createReportDelivery(
  d: OutboxDependencies,
): () => Promise<void> {
  let active: Promise<void> | undefined
  const drain = async () => {
    if (!d.eligible()) return
    for (const row of d.repository.pending(d.now().toISOString())) {
      if (!d.eligible()) return
      const delay = Math.min(
        24 * 60 * 60_000,
        30_000 * 2 ** Math.min(row.attempt_count, 12),
      )
      d.repository.deliveryAttempt(
        row.report_id,
        new Date(d.now().getTime() + delay).toISOString(),
      )
      let status: number
      try {
        status = await d.send(row.payload_json)
      } catch {
        continue
      }
      if (status >= 200 && status < 300)
        d.repository.delivered(row.report_id, d.now().toISOString())
      else if ([400, 401, 403, 404, 413, 415, 422].includes(status)) {
        // A corrected app/server can retry a retained rejected item once a day.
        // The original immutable terminal report remains untouched.
        d.repository.reschedule(
          row.report_id,
          new Date(d.now().getTime() + 24 * 60 * 60_000).toISOString(),
        )
      }
    }
  }
  return () => {
    if (!active)
      active = drain().finally(() => {
        active = undefined
      })
    return active
  }
}
