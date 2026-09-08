import { exportGuideV1ControllerFindCatalogue } from "@/api/generated/export-guides/export-guides"
import type { ApiResponse } from "@/api/mutator"
import { ApiTransportError } from "@/api/mutator"

import { EXPORT_GUIDE_CLIENT_SCHEMA } from "./constants"
import { parseExportGuideCatalogue } from "./parser"
import {
  exportGuideCacheAge,
  type ExportGuideCacheRecord,
  type ExportGuideClock,
  isFreshExportGuideCacheRecord,
  isStrongEtag,
  observeExportGuideCacheRecord,
  readExportGuideCacheRecord,
  systemExportGuideClock,
  writeExportGuideCacheRecord,
} from "./registry"
import type {
  ExportGuideLoadFailure,
  ExportGuideLoadOutcome,
  ExportGuideLocale,
  ExportGuideParseFailure,
  ExportGuideSelector,
} from "./types"

const mapParseFailure = (
  failure: ExportGuideParseFailure,
): ExportGuideLoadFailure => {
  if (failure === "locale_mismatch") return "language_mismatch"
  if (failure === "version_mismatch") return "version_mismatch"
  if (failure === "unsupported_schema") return "unsupported_schema"
  if (failure === "invalid_generic") return "invalid_generic"
  if (failure === "oversized") return "oversized"
  return "invalid_envelope"
}

const fallback = (
  locale: ExportGuideLocale,
  selector: ExportGuideSelector,
  failure: ExportGuideLoadFailure,
  clock: ExportGuideClock,
): ExportGuideLoadOutcome => {
  let candidate: ExportGuideCacheRecord | undefined
  try {
    candidate = readExportGuideCacheRecord(locale, selector)
  } catch {
    return { source: "none", failure: "storage" }
  }
  if (
    candidate !== undefined &&
    isFreshExportGuideCacheRecord(candidate, clock)
  ) {
    return { source: "lkg", catalogue: candidate.catalogue, failure }
  }
  return { source: "none", failure }
}

const responseLanguage = (headers: Headers): string | null =>
  headers.get("Content-Language")

const responseEtag = (headers: Headers): string | null => headers.get("ETag")

const classifyThrown = (
  error: unknown,
  callerSignal: AbortSignal | undefined,
): ExportGuideLoadFailure => {
  if (error instanceof ApiTransportError) {
    return error.failure === "oversized_body" ? "oversized" : "malformed"
  }
  if (error instanceof Error && error.name === "AbortError") {
    return callerSignal?.aborted === true ? "caller_cancelled" : "timeout"
  }
  return "network"
}

export interface LoadExportGuideRequest {
  readonly locale: ExportGuideLocale
  readonly selector: ExportGuideSelector
  readonly signal?: AbortSignal
}

export interface ExportGuideRepository {
  load(request: LoadExportGuideRequest): Promise<ExportGuideLoadOutcome>
}

export function createExportGuideRepository(
  clock: ExportGuideClock = systemExportGuideClock,
): ExportGuideRepository {
  return {
    async load(request): Promise<ExportGuideLoadOutcome> {
      if (
        request.selector.kind === "exact" &&
        !/^[\x20-\x7e]{1,128}$/.test(request.selector.catalogueVersion)
      ) {
        return { source: "none", failure: "version_mismatch" }
      }
      const selector: ExportGuideSelector =
        request.selector.kind === "active"
          ? { kind: "active" }
          : {
              kind: "exact",
              catalogueVersion: request.selector.catalogueVersion,
            }
      let candidate: ExportGuideCacheRecord | undefined
      try {
        candidate = readExportGuideCacheRecord(request.locale, selector)
      } catch {
        return { source: "none", failure: "storage" }
      }
      if (candidate !== undefined) exportGuideCacheAge(candidate, clock)
      const requestEtag = candidate?.etag
      let response: ApiResponse<unknown>
      try {
        response = (await exportGuideV1ControllerFindCatalogue(
          {
            locale: request.locale,
            clientSchema: EXPORT_GUIDE_CLIENT_SCHEMA,
            ...(selector.kind === "exact"
              ? { catalogueVersion: selector.catalogueVersion }
              : {}),
          },
          {
            ...(request.signal === undefined ? {} : { signal: request.signal }),
            ...(requestEtag === undefined
              ? {}
              : { headers: { "If-None-Match": requestEtag } }),
          },
        )) as ApiResponse<unknown>
      } catch (error) {
        return fallback(
          request.locale,
          selector,
          classifyThrown(error, request.signal),
          clock,
        )
      }

      if (response.status === 200) {
        const etag = responseEtag(response.headers)
        if (!isStrongEtag(etag)) {
          return fallback(request.locale, selector, "etag_mismatch", clock)
        }
        if (responseLanguage(response.headers) !== request.locale) {
          return fallback(request.locale, selector, "language_mismatch", clock)
        }
        if (response.data === undefined) {
          return fallback(request.locale, selector, "empty", clock)
        }
        const parsed = parseExportGuideCatalogue(response.data, {
          requestedLocale: request.locale,
          selector,
        })
        if (!parsed.ok) {
          return fallback(
            request.locale,
            selector,
            mapParseFailure(parsed.failure),
            clock,
          )
        }
        const record: ExportGuideCacheRecord = {
          version: 1,
          requestedLocale: request.locale,
          clientSchema: EXPORT_GUIDE_CLIENT_SCHEMA,
          selector,
          resolvedCatalogueVersion: parsed.catalogue.catalogueVersion,
          responseLanguage: request.locale,
          etag,
          validatedAt: clock.wallNow(),
          catalogue: parsed.catalogue,
        }
        try {
          writeExportGuideCacheRecord(record)
          observeExportGuideCacheRecord(record, clock)
        } catch {
          return fallback(request.locale, selector, "storage", clock)
        }
        return { source: "network", catalogue: parsed.catalogue }
      }

      if (response.status === 304) {
        if (response.data !== undefined) {
          return fallback(request.locale, selector, "malformed", clock)
        }
        if (
          candidate === undefined ||
          requestEtag === undefined ||
          responseEtag(response.headers) !== requestEtag
        ) {
          return fallback(request.locale, selector, "etag_mismatch", clock)
        }
        if (
          responseLanguage(response.headers) !== request.locale ||
          candidate.responseLanguage !== request.locale ||
          candidate.requestedLocale !== request.locale
        ) {
          return fallback(request.locale, selector, "language_mismatch", clock)
        }
        if (
          candidate.clientSchema !== EXPORT_GUIDE_CLIENT_SCHEMA ||
          (selector.kind === "exact" &&
            candidate.resolvedCatalogueVersion !== selector.catalogueVersion)
        ) {
          return fallback(request.locale, selector, "version_mismatch", clock)
        }
        const parsed = parseExportGuideCatalogue(candidate.catalogue, {
          requestedLocale: request.locale,
          selector,
        })
        if (!parsed.ok) {
          return fallback(
            request.locale,
            selector,
            mapParseFailure(parsed.failure),
            clock,
          )
        }
        const refreshed: ExportGuideCacheRecord = {
          ...candidate,
          catalogue: parsed.catalogue,
          validatedAt: clock.wallNow(),
        }
        try {
          writeExportGuideCacheRecord(refreshed)
          observeExportGuideCacheRecord(refreshed, clock)
        } catch {
          return fallback(request.locale, selector, "storage", clock)
        }
        return { source: "not_modified", catalogue: parsed.catalogue }
      }

      return fallback(request.locale, selector, "http", clock)
    },
  }
}
