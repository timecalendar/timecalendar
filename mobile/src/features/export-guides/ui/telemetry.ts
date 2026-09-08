import Constants from "expo-constants"
import { Platform } from "react-native"

import {
  type ExportGuideLoadFailure,
  type ExportGuideLocale,
  type ExportGuideResolutionReason,
} from "@/features/export-guides/data"
import { logEvent, recordError, setCrashlyticsAttributes } from "@/firebase"

type Source = "network" | "not_modified" | "lkg" | "none"
type CacheAge = "none" | "fresh" | "stale" | "unknown"

export type ExportGuideAnalyticsEvent =
  | Readonly<{
      name: "export_guide_catalogue_load"
      params: {
        outcome: "success" | "blocked"
        source: Source
        locale: ExportGuideLocale
        schema_version: 1
        cache_age_bucket: CacheAge
        catalogue_version?: string
      }
    }>
  | Readonly<{
      name: "export_guide_provider_resolved"
      params: {
        requested_provider: string
        resolved_provider: string
        reason: ExportGuideResolutionReason
        catalogue_version: string
      }
    }>
  | Readonly<{
      name: "export_guide_started"
      params: {
        provider_slug: string
        page_count: number
        locale: ExportGuideLocale
        catalogue_version: string
      }
    }>
  | Readonly<{
      name: "export_guide_page_viewed"
      params: {
        provider_slug: string
        page_index: number
        page_count: number
        catalogue_version: string
      }
    }>
  | Readonly<{
      name: "export_guide_completed"
      params: {
        provider_slug: string
        page_count: number
        catalogue_version: string
      }
    }>
  | Readonly<{
      name: "export_guide_retry"
      params: {
        prior_failure: ExportGuideLoadFailure
        attempt_bucket: "1" | "2" | "3_plus"
        lkg_availability: "unknown" | "unavailable"
      }
    }>
  | Readonly<{
      name: "export_guide_blocked"
      params: {
        failure: ExportGuideLoadFailure
        cache_age_bucket: CacheAge
        locale: ExportGuideLocale
        schema_version: 1
      }
    }>
  | Readonly<{
      name: "export_guide_image_failed"
      params: {
        provider_slug: string
        image_role: "thumbnail" | "page"
        failure: "load"
        page_index?: number
      }
    }>
  | Readonly<{
      name: "export_guide_connect_skipped"
      params: {
        reason: "missing_url" | "unsafe_url"
        provider_slug: string
      }
    }>

function allowlistedParams(event: ExportGuideAnalyticsEvent) {
  switch (event.name) {
    case "export_guide_catalogue_load":
      return {
        outcome: event.params.outcome,
        source: event.params.source,
        locale: event.params.locale,
        schema_version: event.params.schema_version,
        cache_age_bucket: event.params.cache_age_bucket,
        ...(event.params.catalogue_version === undefined
          ? {}
          : { catalogue_version: event.params.catalogue_version }),
      }
    case "export_guide_provider_resolved":
      return {
        requested_provider: event.params.requested_provider,
        resolved_provider: event.params.resolved_provider,
        reason: event.params.reason,
        catalogue_version: event.params.catalogue_version,
      }
    case "export_guide_started":
      return {
        provider_slug: event.params.provider_slug,
        page_count: event.params.page_count,
        locale: event.params.locale,
        catalogue_version: event.params.catalogue_version,
      }
    case "export_guide_page_viewed":
      return {
        provider_slug: event.params.provider_slug,
        page_index: event.params.page_index,
        page_count: event.params.page_count,
        catalogue_version: event.params.catalogue_version,
      }
    case "export_guide_completed":
      return {
        provider_slug: event.params.provider_slug,
        page_count: event.params.page_count,
        catalogue_version: event.params.catalogue_version,
      }
    case "export_guide_retry":
      return {
        prior_failure: event.params.prior_failure,
        attempt_bucket: event.params.attempt_bucket,
        lkg_availability: event.params.lkg_availability,
      }
    case "export_guide_blocked":
      return {
        failure: event.params.failure,
        cache_age_bucket: event.params.cache_age_bucket,
        locale: event.params.locale,
        schema_version: event.params.schema_version,
      }
    case "export_guide_image_failed":
      return {
        provider_slug: event.params.provider_slug,
        image_role: event.params.image_role,
        failure: event.params.failure,
        ...(event.params.page_index === undefined
          ? {}
          : { page_index: event.params.page_index }),
      }
    case "export_guide_connect_skipped":
      return {
        reason: event.params.reason,
        provider_slug: event.params.provider_slug,
      }
  }
}

export function emitExportGuideEvent(event: ExportGuideAnalyticsEvent): void {
  void logEvent(event.name, {
    ...allowlistedParams(event),
    app_version: Constants.expoConfig?.version ?? "unknown",
    platform: Platform.OS,
  })
}

export function recordExportGuideInvariant(
  kind: "invalid_transition" | "invalid_page" | "storage_corruption",
): void {
  void setCrashlyticsAttributes({ export_guide_invariant: kind })
  recordError(new Error(`export-guide invariant: ${kind}`))
}

export function attemptBucket(attempt: number): "1" | "2" | "3_plus" {
  if (attempt <= 1) return "1"
  if (attempt === 2) return "2"
  return "3_plus"
}
