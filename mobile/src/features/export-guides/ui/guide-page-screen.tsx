import { router, Stack, useLocalSearchParams } from "expo-router"
import { type RefObject, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  AccessibilityInfo,
  findNodeHandle,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"

import { Button, RootPage, ThemedText } from "@/design"
import {
  type ExportGuideLoadOutcome,
  type ExportGuideSelector,
  resolveExportGuideProvider,
} from "@/features/export-guides/data"
import {
  earliestLegalRoute,
  type ImportJourneyAction,
  type ImportJourneyState,
  useImportDraft,
} from "@/features/onboarding/draft"
import { Spacing } from "@/theme"

import { ExportGuideImage } from "./export-guide-image"
import { GuideBlockingError, GuideProgress } from "./guide-status"
import { emitExportGuideEvent } from "./telemetry"
import { exportGuideLocale, useExportGuideLoad } from "./use-export-guide-load"

const parsePageIndex = (
  value: string | string[] | undefined,
): number | null => {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw === undefined || !/^(0|[1-9]\d*)$/.test(raw)) return null
  const parsed = Number(raw)
  return Number.isSafeInteger(parsed) ? parsed : null
}

type ActiveGuideState = Extract<
  ImportJourneyState,
  { phase: "guide" | "completed" }
>

function guideRequest(state: ImportJourneyState): {
  selector: ExportGuideSelector | null
  requestedProvider: string | null
} {
  if (state.phase === "empty" || state.draft.institution.kind !== "listed") {
    return { selector: null, requestedProvider: null }
  }
  const { exportGuide } = state.draft.institution.school
  return {
    selector: { kind: "exact", catalogueVersion: exportGuide.catalogueVersion },
    requestedProvider: exportGuide.providerSlug,
  }
}

function validGuidePage(
  state: ActiveGuideState | null,
  pageIndex: number | null,
): { state: ActiveGuideState; pageIndex: number } | null {
  return state !== null &&
    pageIndex !== null &&
    pageIndex < state.snapshot.pages.length &&
    pageIndex <= state.visitedThrough
    ? { state, pageIndex }
    : null
}

export default function GuidePageScreen() {
  const { t, i18n } = useTranslation()
  const params = useLocalSearchParams<{ pageIndex?: string | string[] }>()
  const pageIndex = parsePageIndex(params.pageIndex)
  const { state, dispatch } = useImportDraft()
  const focusTarget = useRef<View>(null)

  const { selector, requestedProvider } = guideRequest(state)
  const loadsPageZero =
    pageIndex === 0 &&
    state.phase === "draft" &&
    requestedProvider !== null &&
    earliestLegalRoute(state) === "/onboarding/export-guide/0"

  const onCatalogue = (
    outcome: Exclude<ExportGuideLoadOutcome, { source: "none" }>,
  ) => {
    if (requestedProvider === null) return
    const resolution = resolveExportGuideProvider(
      outcome.catalogue,
      requestedProvider,
    )
    emitExportGuideEvent({
      name: "export_guide_provider_resolved",
      params: {
        requested_provider: requestedProvider,
        resolved_provider: resolution.snapshot.providerSlug,
        reason: resolution.reason,
        catalogue_version: resolution.snapshot.catalogueVersion,
      },
    })
    dispatch({
      type: "start-guide",
      snapshot: resolution.snapshot,
      draftRevision: state.draftRevision,
    })
    emitExportGuideEvent({
      name: "export_guide_started",
      params: {
        provider_slug: resolution.snapshot.providerSlug,
        page_count: resolution.snapshot.pages.length,
        locale: resolution.snapshot.locale,
        catalogue_version: resolution.snapshot.catalogueVersion,
      },
    })
  }
  const { busy, load, retry } = useExportGuideLoad({
    state,
    dispatch,
    selector,
    onCatalogue,
  })

  useEffect(() => {
    if (loadsPageZero) load()
  }, [load, loadsPageZero])

  const snapshotState =
    state.phase === "guide" || state.phase === "completed" ? state : null
  const validPage = validGuidePage(snapshotState, pageIndex)
  const onValidPage = validPage !== null

  useEffect(() => {
    if (
      snapshotState !== null &&
      snapshotState.snapshot.locale !==
        exportGuideLocale(i18n.resolvedLanguage ?? i18n.language)
    ) {
      dispatch({ type: "invalidate-guide" })
    }
  }, [dispatch, i18n.language, i18n.resolvedLanguage, snapshotState])

  useEffect(() => {
    if (state.phase === "resolving" || state.phase === "blocked") return
    if (loadsPageZero || onValidPage) return
    const target = earliestLegalRoute(state)
    if (target !== `/onboarding/export-guide/${pageIndex ?? "invalid"}`) {
      router.replace(target)
    }
  }, [loadsPageZero, onValidPage, pageIndex, state])

  useEffect(() => {
    const viewed = validGuidePage(snapshotState, pageIndex)
    if (viewed === null) return
    const { snapshot } = viewed.state
    emitExportGuideEvent({
      name: "export_guide_page_viewed",
      params: {
        provider_slug: snapshot.providerSlug,
        page_index: viewed.pageIndex,
        page_count: snapshot.pages.length,
        catalogue_version: snapshot.catalogueVersion,
      },
    })
    const handle = findNodeHandle(focusTarget.current)
    if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle)
  }, [pageIndex, snapshotState])

  const shownPage = state.phase === "blocked" ? null : validPage

  return (
    <>
      <Stack.Screen
        options={
          shownPage === null
            ? { title: t("exportGuide.page.title") }
            : {
                title:
                  shownPage.state.snapshot.pages[shownPage.pageIndex]!.title,
              }
        }
      />
      {state.phase === "blocked" ? (
        <GuideBlockingError retry={retry} busy={busy} />
      ) : shownPage === null ? (
        <GuideProgress />
      ) : (
        <GuidePageContent
          state={shownPage.state}
          pageIndex={shownPage.pageIndex}
          focusTarget={focusTarget}
          dispatch={dispatch}
        />
      )}
    </>
  )
}

function GuidePageContent({
  state,
  pageIndex,
  focusTarget,
  dispatch,
}: {
  state: ActiveGuideState
  pageIndex: number
  focusTarget: RefObject<View | null>
  dispatch: (action: ImportJourneyAction) => void
}) {
  const { t } = useTranslation()
  const page = state.snapshot.pages[pageIndex]!
  const total = state.snapshot.pages.length
  const progress = t("exportGuide.progress", {
    current: pageIndex + 1,
    total,
  })
  const next = () => {
    if (pageIndex < total - 1) {
      if (state.phase === "guide") {
        dispatch({ type: "visit-page", pageIndex: pageIndex + 1 })
      }
      router.push(`/onboarding/export-guide/${pageIndex + 1}`)
      return
    }
    if (state.phase === "guide") {
      dispatch({ type: "complete-guide", pageIndex })
      emitExportGuideEvent({
        name: "export_guide_completed",
        params: {
          provider_slug: state.snapshot.providerSlug,
          page_count: total,
          catalogue_version: state.snapshot.catalogueVersion,
        },
      })
    }
    router.push("/onboarding/import")
  }

  return (
    <RootPage
      scrollsUnderHeader
      testID="export-guide-page"
      lane="readable"
      style={styles.fill}
    >
      {({ laneStyle }) => (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          testID="export-guide-page-scroll"
          contentContainerStyle={[laneStyle, styles.content]}
        >
          <View
            ref={focusTarget}
            accessible
            accessibilityLabel={`${page.title}, ${progress}`}
          >
            <ThemedText testID="export-guide-progress" tone="secondary">
              {progress}
            </ThemedText>
          </View>
          <ThemedText>{page.description}</ThemedText>
          {page.image === undefined ? null : (
            <ExportGuideImage
              key={pageIndex}
              image={page.image}
              testID="export-guide-page-image"
              onFailure={() => {
                emitExportGuideEvent({
                  name: "export_guide_image_failed",
                  params: {
                    provider_slug: state.snapshot.providerSlug,
                    image_role: "page",
                    page_index: pageIndex,
                    failure: "load",
                  },
                })
              }}
            />
          )}
          <Button
            variant="filled"
            testID="export-guide-next"
            label={
              pageIndex === total - 1
                ? t("exportGuide.finish")
                : t("exportGuide.next")
            }
            onPress={next}
          />
          <Button
            variant="outlined"
            testID="export-guide-visible-back"
            label={t("common.back")}
            onPress={() => router.back()}
          />
        </ScrollView>
      )}
    </RootPage>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { gap: Spacing.four, paddingVertical: Spacing.four },
})
