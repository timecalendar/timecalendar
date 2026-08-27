import {
  ICAL_ATTEMPT_TIMEOUT_MS,
  ICAL_FETCH_BUDGET_MS,
  ICAL_RETRY_ATTEMPTS,
  MOBILE_REQUEST_TIMEOUT_MS,
  USER_SYNC_CONCURRENCY,
  USER_SYNC_WORK_DEADLINE_MS,
} from "./calendar-sync.constants"

describe("calendar sync budgets", () => {
  it("keeps fetch work inside the batch and mobile request budgets", () => {
    expect(ICAL_ATTEMPT_TIMEOUT_MS).toBeLessThan(ICAL_FETCH_BUDGET_MS)
    expect(ICAL_FETCH_BUDGET_MS).toBeLessThan(USER_SYNC_WORK_DEADLINE_MS)
    expect(USER_SYNC_WORK_DEADLINE_MS).toBeLessThan(MOBILE_REQUEST_TIMEOUT_MS)
    expect(ICAL_RETRY_ATTEMPTS).toBe(2)
    expect(USER_SYNC_CONCURRENCY).toBe(3)
  })
})
