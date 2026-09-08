import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  createExportGuideRepository,
  type ExportGuideLoadOutcome,
  type ExportGuideLocale,
  type ExportGuideSelector,
} from "@/features/export-guides/data"
import {
  type ImportJourneyAction,
  type ImportJourneyState,
} from "@/features/onboarding/draft"

import { createExportGuideJourneyCoordinator } from "./coordinator"
import { attemptBucket, emitExportGuideEvent } from "./telemetry"

export const exportGuideLocale = (
  language: string | undefined,
): ExportGuideLocale => (language?.toLowerCase().startsWith("fr") ? "fr" : "en")

export function useExportGuideLoad({
  state,
  dispatch,
  selector,
  onCatalogue,
}: {
  state: ImportJourneyState
  dispatch: (action: ImportJourneyAction) => void
  selector: ExportGuideSelector | null
  onCatalogue: (
    outcome: Exclude<ExportGuideLoadOutcome, { source: "none" }>,
  ) => void
}) {
  const { i18n } = useTranslation()
  const locale = exportGuideLocale(i18n.resolvedLanguage ?? i18n.language)
  const coordinator = useMemo(
    () => createExportGuideJourneyCoordinator(createExportGuideRepository()),
    [],
  )
  const mounted = useRef(true)
  const [busy, setBusy] = useState(false)
  const attempt = useRef(0)
  const latest = useRef({ state, locale, selector, onCatalogue })
  useEffect(() => {
    latest.current = { state, locale, selector, onCatalogue }
  }, [locale, onCatalogue, selector, state])

  useEffect(
    () => () => {
      mounted.current = false
      coordinator.cancel()
    },
    [coordinator],
  )

  const load = useCallback(() => {
    const current = latest.current
    if (current.state.phase === "empty" || current.selector === null) return
    const draftRevision = current.state.draftRevision
    const nextAttempt = ++attempt.current
    setBusy(true)
    dispatch({
      type: "start-resolution",
      locale: current.locale,
      selector: current.selector,
      attempt: nextAttempt,
    })
    void coordinator
      .load({
        draftRevision,
        locale: current.locale,
        selector: current.selector,
      })
      .then(({ request, outcome }) => {
        const now = latest.current
        if (
          !mounted.current ||
          nextAttempt !== attempt.current ||
          now.state.phase === "empty" ||
          now.state.draftRevision !== request.draftRevision ||
          now.locale !== request.locale
        )
          return
        emitExportGuideEvent({
          name: "export_guide_catalogue_load",
          params: {
            outcome: outcome.source === "none" ? "blocked" : "success",
            source: outcome.source,
            locale: request.locale,
            schema_version: 1,
            cache_age_bucket: outcome.source === "lkg" ? "fresh" : "none",
            ...(outcome.source === "none"
              ? {}
              : { catalogue_version: outcome.catalogue.catalogueVersion }),
          },
        })
        if (outcome.source === "none") {
          emitExportGuideEvent({
            name: "export_guide_blocked",
            params: {
              failure: outcome.failure,
              cache_age_bucket: "unknown",
              locale: request.locale,
              schema_version: 1,
            },
          })
          dispatch({
            type: "block",
            locale: request.locale,
            selector: request.selector,
            failure: outcome.failure,
            attempt: nextAttempt,
            draftRevision,
          })
        } else {
          current.onCatalogue(outcome)
        }
      })
      .finally(() => mounted.current && setBusy(false))
  }, [coordinator, dispatch])

  const retry = useCallback(() => {
    const current = latest.current.state
    if (current.phase === "blocked") {
      emitExportGuideEvent({
        name: "export_guide_retry",
        params: {
          prior_failure: current.failure,
          attempt_bucket: attemptBucket(current.attempt + 1),
          lkg_availability: "unknown",
        },
      })
    }
    load()
  }, [load])

  return { locale, busy, load, retry }
}
