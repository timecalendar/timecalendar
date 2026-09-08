import { router, Stack, useLocalSearchParams } from "expo-router"
import { type RefObject, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import {
  AccessibilityInfo,
  findNodeHandle,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native"

import { PrimaryAction } from "@/components/primary-action"
import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
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
import { Radii, Spacing, useTheme } from "@/theme"

import { ExportGuideImage } from "./export-guide-image"
import { GuideBlockingError, GuideLoading } from "./guide-status"
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

export default function GuidePageScreen() {
  const { i18n } = useTranslation()
  const params = useLocalSearchParams<{ pageIndex?: string | string[] }>()
  const pageIndex = parsePageIndex(params.pageIndex)
  const { state, dispatch } = useImportDraft()
  const heading = useRef<View>(null)

  const listedInstitution =
    state.phase !== "empty" && state.draft.institution.kind === "listed"
      ? state.draft.institution
      : null
  const selector: ExportGuideSelector | null =
    listedInstitution === null
      ? null
      : {
          kind: "exact",
          catalogueVersion:
            listedInstitution.school.exportGuide.catalogueVersion,
        }
  const requestedProvider =
    listedInstitution?.school.exportGuide.providerSlug ?? null
  const legalPageZero =
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
    if (
      pageIndex === 0 &&
      state.phase === "draft" &&
      requestedProvider !== null &&
      legalPageZero
    ) {
      load()
    }
  }, [legalPageZero, load, pageIndex, requestedProvider, state.phase])

  const snapshotState =
    state.phase === "guide" || state.phase === "completed" ? state : null
  const validPage =
    snapshotState !== null &&
    pageIndex !== null &&
    pageIndex < snapshotState.snapshot.pages.length &&
    pageIndex <= snapshotState.visitedThrough

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
    if (
      pageIndex === 0 &&
      state.phase === "draft" &&
      requestedProvider !== null &&
      legalPageZero
    )
      return
    if (!validPage) {
      const target = earliestLegalRoute(state)
      if (target !== `/onboarding/export-guide/${pageIndex ?? "invalid"}`) {
        router.replace(target)
      }
    }
  }, [legalPageZero, pageIndex, requestedProvider, state, validPage])

  useEffect(() => {
    if (!validPage || pageIndex === null || snapshotState === null) return
    emitExportGuideEvent({
      name: "export_guide_page_viewed",
      params: {
        provider_slug: snapshotState.snapshot.providerSlug,
        page_index: pageIndex,
        page_count: snapshotState.snapshot.pages.length,
        catalogue_version: snapshotState.snapshot.catalogueVersion,
      },
    })
    const handle = findNodeHandle(heading.current)
    if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle)
  }, [pageIndex, snapshotState, validPage])

  if (state.phase === "blocked") {
    return <GuideBlockingError retry={retry} busy={busy} />
  }
  if (!validPage || pageIndex === null || snapshotState === null) {
    return <GuideLoading />
  }

  return (
    <GuidePageContent
      state={snapshotState}
      pageIndex={pageIndex}
      heading={heading}
      dispatch={dispatch}
    />
  )
}

function GuidePageContent({
  state,
  pageIndex,
  heading,
  dispatch,
}: {
  state: ActiveGuideState
  pageIndex: number
  heading: RefObject<View | null>
  dispatch: (action: ImportJourneyAction) => void
}) {
  const { t } = useTranslation()
  const theme = useTheme()
  const page = state.snapshot.pages[pageIndex]!
  const total = state.snapshot.pages.length
  const progress = t("exportGuide.progress", {
    current: pageIndex + 1,
    total,
  })
  const next = () => {
    if (state.phase !== "guide") return
    if (pageIndex < total - 1) {
      dispatch({ type: "visit-page", pageIndex: pageIndex + 1 })
      router.push(`/onboarding/export-guide/${pageIndex + 1}`)
      return
    }
    dispatch({ type: "complete-guide", pageIndex })
    emitExportGuideEvent({
      name: "export_guide_completed",
      params: {
        provider_slug: state.snapshot.providerSlug,
        page_count: total,
        catalogue_version: state.snapshot.catalogueVersion,
      },
    })
    router.push("/onboarding/import")
  }

  return (
    <>
      <Stack.Screen options={{ title: t("exportGuide.page.title") }} />
      <RootPage lane="readable" style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content}>
          <View ref={heading} accessible accessibilityRole="header">
            <ThemedText type="title">{page.title}</ThemedText>
            <ThemedText
              testID="export-guide-progress"
              accessibilityLabel={progress}
              themeColor="textSecondary"
            >
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
          <PrimaryAction
            testID="export-guide-next"
            label={
              pageIndex === total - 1
                ? t("exportGuide.finish")
                : t("exportGuide.next")
            }
            disabled={state.phase !== "guide"}
            onPress={next}
          />
          <Pressable
            testID="export-guide-visible-back"
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            onPress={() => router.back()}
            style={[styles.back, { borderColor: theme.primary }]}
          >
            <ThemedText type="smallBold" themeColor="primary">
              {t("common.back")}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </RootPage>
    </>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { gap: Spacing.four, paddingBottom: Spacing.four },
  back: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: Radii.medium,
  },
})
