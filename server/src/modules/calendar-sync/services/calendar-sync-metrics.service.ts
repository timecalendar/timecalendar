import { Injectable } from "@nestjs/common"
import meter from "config/observability/meter"

export type CalendarSyncOutcome =
  | "success"
  | "partial_deadline"
  | "client_cancelled"
  | "error"

export type CalendarSyncPhase =
  | "candidate_selection"
  | "calendar_work"
  | "diff_persist"
  | "response_hydration"

@Injectable()
export class CalendarSyncMetricsService {
  calendarSyncCounter = meter.createCounter("calendar_sync_total", {
    // All labels are bounded to keep VictoriaMetrics cardinality finite:
    //   school     - school code slug (enum-like)
    //   status     - "success" | "error"
    //   error_type - the exception's name/class (bounded; never the raw message)
    //   action     - "create" | "update"
    description:
      "Count of calendar syncs (all labels bounded for cardinality safety)",
    unit: "{requests}",
  })

  private readonly batchDuration = meter.createHistogram(
    "calendar_sync_batch_duration_seconds",
    { unit: "s", description: "Duration of a user calendar-sync batch" },
  )
  private readonly phaseDuration = meter.createHistogram(
    "calendar_sync_phase_duration_seconds",
    { unit: "s", description: "Duration of a bounded calendar-sync phase" },
  )
  private readonly batchCalendarCount = meter.createHistogram(
    "calendar_sync_batch_calendars",
    { unit: "{calendars}", description: "Calendar counts per sync batch" },
  )
  private readonly activeUpstream = meter.createUpDownCounter(
    "calendar_sync_upstream_active",
    { unit: "{operations}", description: "Currently active upstream fetches" },
  )
  private readonly attemptCounter = meter.createCounter(
    "calendar_sync_upstream_attempt_total",
    { unit: "{attempts}", description: "Upstream transport attempts" },
  )
  private readonly outcomeCounter = meter.createCounter(
    "calendar_sync_batch_outcome_total",
    { unit: "{batches}", description: "Terminal sync batch outcomes" },
  )

  recordBatch(
    durationMs: number,
    outcome: CalendarSyncOutcome,
    counts: { selected: number; started: number; completed: number },
  ) {
    this.batchDuration.record(durationMs / 1_000, { outcome })
    this.outcomeCounter.add(1, { outcome })
    this.batchCalendarCount.record(counts.selected, { state: "selected" })
    this.batchCalendarCount.record(counts.started, { state: "started" })
    this.batchCalendarCount.record(counts.completed, { state: "completed" })
  }

  async measurePhase<T>(phase: CalendarSyncPhase, work: () => Promise<T>) {
    const startedAt = performance.now()
    try {
      return await work()
    } finally {
      this.phaseDuration.record((performance.now() - startedAt) / 1_000, {
        phase,
      })
    }
  }

  upstreamStarted() {
    this.activeUpstream.add(1)
  }

  upstreamCompleted() {
    this.activeUpstream.add(-1)
  }

  recordAttempt() {
    this.attemptCounter.add(1)
  }
}
