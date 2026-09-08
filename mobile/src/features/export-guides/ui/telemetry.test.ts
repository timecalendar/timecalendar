import { logEvent, recordError, setCrashlyticsAttributes } from "@/firebase"

import {
  attemptBucket,
  emitExportGuideEvent,
  type ExportGuideAnalyticsEvent,
  recordExportGuideInvariant,
} from "./telemetry"

jest.mock("@/firebase", () => ({
  logEvent: jest.fn(() => Promise.resolve()),
  recordError: jest.fn(),
  setCrashlyticsAttributes: jest.fn(() => Promise.resolve()),
}))

describe("export-guide telemetry", () => {
  const cases: readonly Readonly<{
    event: ExportGuideAnalyticsEvent
    expected: Readonly<Record<string, unknown>>
  }>[] = [
    {
      event: {
        name: "export_guide_catalogue_load",
        params: {
          outcome: "success",
          source: "network",
          locale: "fr",
          schema_version: 1,
          cache_age_bucket: "none",
          catalogue_version: "v1",
        },
      },
      expected: {
        outcome: "success",
        source: "network",
        locale: "fr",
        schema_version: 1,
        cache_age_bucket: "none",
        catalogue_version: "v1",
      },
    },
    {
      event: {
        name: "export_guide_provider_resolved",
        params: {
          requested_provider: "provider-one",
          resolved_provider: "generic",
          reason: "generic",
          catalogue_version: "v1",
        },
      },
      expected: {
        requested_provider: "provider-one",
        resolved_provider: "generic",
        reason: "generic",
        catalogue_version: "v1",
      },
    },
    {
      event: {
        name: "export_guide_started",
        params: {
          provider_slug: "provider-one",
          page_count: 2,
          locale: "en",
          catalogue_version: "v1",
        },
      },
      expected: {
        provider_slug: "provider-one",
        page_count: 2,
        locale: "en",
        catalogue_version: "v1",
      },
    },
    {
      event: {
        name: "export_guide_page_viewed",
        params: {
          provider_slug: "provider-one",
          page_index: 1,
          page_count: 2,
          catalogue_version: "v1",
        },
      },
      expected: {
        provider_slug: "provider-one",
        page_index: 1,
        page_count: 2,
        catalogue_version: "v1",
      },
    },
    {
      event: {
        name: "export_guide_completed",
        params: {
          provider_slug: "provider-one",
          page_count: 2,
          catalogue_version: "v1",
        },
      },
      expected: {
        provider_slug: "provider-one",
        page_count: 2,
        catalogue_version: "v1",
      },
    },
    {
      event: {
        name: "export_guide_retry",
        params: {
          prior_failure: "timeout",
          attempt_bucket: "2",
          lkg_availability: "unavailable",
        },
      },
      expected: {
        prior_failure: "timeout",
        attempt_bucket: "2",
        lkg_availability: "unavailable",
      },
    },
    {
      event: {
        name: "export_guide_blocked",
        params: {
          failure: "malformed",
          cache_age_bucket: "unknown",
          locale: "en",
          schema_version: 1,
        },
      },
      expected: {
        failure: "malformed",
        cache_age_bucket: "unknown",
        locale: "en",
        schema_version: 1,
      },
    },
    {
      event: {
        name: "export_guide_image_failed",
        params: {
          provider_slug: "provider-one",
          image_role: "page",
          failure: "load",
          page_index: 1,
        },
      },
      expected: {
        provider_slug: "provider-one",
        image_role: "page",
        failure: "load",
        page_index: 1,
      },
    },
    {
      event: {
        name: "export_guide_connect_skipped",
        params: { reason: "unsafe_url", provider_slug: "provider-one" },
      },
      expected: { reason: "unsafe_url", provider_slug: "provider-one" },
    },
  ]

  it.each(cases)(
    "projects the exact allowlist for $event.name",
    ({ event, expected }) => {
      const forbidden = {
        schoolName: "Sensitive University",
        programme: "Private programme",
        url: "https://example.com/private-calendar.ics",
        routeParams: "/onboarding/ical-url?calendar=private",
        token: "fixture-secret-token",
        searchText: "private search",
        copy: "private server-owned copy",
        payload: { institution: "Sensitive University" },
        headers: { authorization: "fixture authorization" },
        rawError: new Error("private transport detail"),
      }
      emitExportGuideEvent({
        ...event,
        params: { ...event.params, ...forbidden },
      } as ExportGuideAnalyticsEvent)

      expect(logEvent).toHaveBeenLastCalledWith(event.name, {
        ...expected,
        app_version: expect.any(String),
        platform: expect.any(String),
      })
      const emitted = JSON.stringify((logEvent as jest.Mock).mock.calls.at(-1))
      for (const value of Object.values(forbidden)) {
        const serialized =
          value instanceof Error ? value.message : JSON.stringify(value)
        expect(emitted).not.toContain(serialized)
      }
    },
  )

  it("records only static invariant categories in Crashlytics", () => {
    recordExportGuideInvariant("invalid_page")
    expect(setCrashlyticsAttributes).toHaveBeenCalledWith({
      export_guide_invariant: "invalid_page",
    })
    expect(recordError).toHaveBeenCalledWith(
      new Error("export-guide invariant: invalid_page"),
    )
  })

  it.each([
    [0, "1"],
    [2, "2"],
    [3, "3_plus"],
    [99, "3_plus"],
  ])("bounds attempt %s to %s", (attempt, bucket) => {
    expect(attemptBucket(attempt)).toBe(bucket)
  })
})
