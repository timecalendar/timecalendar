const { calendarFixture, indexForToken } = require("./fixtures.cjs")

function createRehearsalTransport(originalFetch, ResponseType = Response) {
  let mode = "offline"
  let revision = 1
  let reportEndpoint = null
  const counts = {
    total: 0,
    offlineFailures: 0,
    blockedUnknown: 0,
    syncCalls: 0,
    activityCalls: 0,
    reportCalls: 0,
    reportsForwarded: 0,
    reportsAccepted: 0,
  }
  const reports = new Map()
  const response = (data, status = 200) =>
    new ResponseType(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  const fail = () => {
    throw new TypeError("Synthetic offline transport")
  }
  const parseBody = (options) => {
    if (typeof options.body !== "string" || options.body.length > 16384)
      throw new Error("Invalid synthetic request")
    return JSON.parse(options.body)
  }

  async function fetch(input, options = {}) {
    counts.total++
    if (mode === "offline") {
      counts.offlineFailures++
      return fail()
    }
    const url = new URL(typeof input === "string" ? input : input.url)
    if (url.origin !== "https://api-v2.timecalendar.app") {
      counts.blockedUnknown++
      return fail()
    }
    const method = (options.method ?? "GET").toUpperCase()
    if (method === "POST" && url.pathname === "/calendars/sync") {
      counts.syncCalls++
      const body = parseBody(options)
      if (!Array.isArray(body.tokens) || body.tokens.length > 3)
        throw new Error("Invalid synthetic calendar batch")
      return response(
        body.tokens.map((token) =>
          calendarFixture(indexForToken(token), revision),
        ),
      )
    }
    if (method === "POST" && url.pathname === "/v1/calendar-logs/search") {
      counts.activityCalls++
      const body = parseBody(options)
      if (body.tokens) body.tokens.forEach(indexForToken)
      return response({
        items: [],
        nextCursor: null,
        asOf: new Date().toISOString(),
        ...(body.unreadSince ? { unreadCount: 0 } : {}),
      })
    }
    if (method === "POST" && url.pathname === "/v1/migration-reports") {
      counts.reportCalls++
      const report = parseBody(options)
      if (
        report.schemaVersion !== 1 ||
        !/^[\da-f-]{36}$/i.test(report.reportId) ||
        !["success", "partial", "failed"].includes(report.outcome)
      )
        return response({ message: "Synthetic report refused" }, 400)
      if (!reports.has(report.reportId) && reports.size < 10)
        reports.set(report.reportId, {
          reportId: report.reportId,
          outcome: report.outcome,
          attempts: 0,
          accepted: false,
        })
      const receipt = reports.get(report.reportId)
      if (receipt) receipt.attempts++
      // Without a real local receiver, the outbox remains pending rather than
      // pretending a capture is durable server delivery.
      if (!reportEndpoint)
        return response(
          { message: "Synthetic report receiver not configured" },
          503,
        )
      counts.reportsForwarded++
      const result = await originalFetch(reportEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: options.body,
        signal: options.signal,
      })
      if (result.ok) {
        counts.reportsAccepted++
        if (receipt) receipt.accepted = true
      }
      return result
    }
    if (url.pathname === "/feature-flags/evaluate" && method === "GET") {
      return response(
        Object.fromEntries(
          (url.searchParams.get("keys") ?? "")
            .split(",")
            .filter(Boolean)
            .map((key) => [key, false]),
        ),
      )
    }
    if (url.pathname === "/notification-subscription" && method === "POST")
      return response({})
    counts.blockedUnknown++
    return fail()
  }

  return {
    fetch,
    setMode(next, nextRevision = revision) {
      if (
        !["offline", "online"].includes(next) ||
        ![1, 2].includes(nextRevision)
      )
        throw new Error("Invalid rehearsal mode")
      mode = next
      revision = nextRevision
      return this.status()
    },
    setReportEndpoint(endpoint) {
      if (endpoint === null) {
        reportEndpoint = null
        return
      }
      const url = new URL(endpoint)
      const local =
        /^(?:127\.0\.0\.1|localhost|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})$/.test(
          url.hostname,
        )
      if (
        !local ||
        url.protocol !== "http:" ||
        url.username ||
        url.password ||
        url.pathname !== "/v1/migration-reports" ||
        url.search ||
        url.hash
      )
        throw new Error("Only an explicit local report endpoint is allowed")
      reportEndpoint = url.toString()
    },
    status() {
      return {
        harness: "synthetic-fetch-only",
        mode,
        revision,
        localReportReceiverConfigured: reportEndpoint !== null,
        counts: { ...counts },
        reports: [...reports.values()].map((value) => ({ ...value })),
      }
    },
  }
}

module.exports = { createRehearsalTransport }
