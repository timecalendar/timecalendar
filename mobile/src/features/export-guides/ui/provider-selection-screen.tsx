import { Image } from "expo-image"
import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, StyleSheet } from "react-native"

import { ListRow, listRowPosition, PageIntro, RootPage } from "@/design"
import {
  type ExportGuideCatalogue,
  type ExportGuideLoadOutcome,
  type ExportGuideProvider,
  getSelectableExportGuideProviders,
  resolveExportGuideProvider,
} from "@/features/export-guides/data"
import {
  useImportDraft,
  useJourneyGateRoute,
} from "@/features/onboarding/draft"
import { Radii, Spacing } from "@/theme"

import { GuideBlockingError, GuideProgress } from "./guide-status"
import { emitExportGuideEvent } from "./telemetry"
import { useExportGuideLoad } from "./use-export-guide-load"

export default function ProviderSelectionScreen() {
  const { t } = useTranslation()
  const { state, dispatch } = useImportDraft()
  const legal = useJourneyGateRoute(state, "providers")
  const [failedImages, setFailedImages] = useState<ReadonlySet<string>>(
    new Set(),
  )

  const onCatalogue = (
    outcome: Exclude<ExportGuideLoadOutcome, { source: "none" }>,
  ) => {
    dispatch({
      type: "show-provider-selection",
      locale: outcome.catalogue.locale,
      catalogue: outcome.catalogue,
      providers: getSelectableExportGuideProviders(outcome.catalogue),
      draftRevision: state.draftRevision,
    })
  }
  const { busy, load, retry } = useExportGuideLoad({
    state,
    dispatch,
    selector: { kind: "active" },
    onCatalogue,
  })

  useEffect(() => {
    if (state.phase === "draft" && state.draft.institution.kind === "unlisted")
      load()
  }, [load, state])

  if (!legal) return null
  const header = (
    <Stack.Screen options={{ title: t("exportGuide.provider.headerTitle") }} />
  )
  if (state.phase === "blocked") {
    return (
      <>
        {header}
        <GuideBlockingError retry={retry} busy={busy} />
      </>
    )
  }
  const catalogue =
    state.phase === "selecting-provider"
      ? state.catalogue
      : state.phase === "guide" || state.phase === "completed"
        ? state.selectionCatalogue
        : undefined
  const providers =
    state.phase === "selecting-provider"
      ? state.providers
      : state.phase === "guide" || state.phase === "completed"
        ? state.selectionProviders
        : undefined
  if (catalogue === undefined || providers === undefined)
    return (
      <>
        {header}
        <GuideProgress />
      </>
    )

  const instructions = t("exportGuide.provider.instructions")
  const providerHint = t("exportGuide.provider.hint")

  const select = (
    provider: ExportGuideProvider,
    catalogue: ExportGuideCatalogue,
  ) => {
    const resolution = resolveExportGuideProvider(catalogue, provider.slug)
    emitExportGuideEvent({
      name: "export_guide_provider_resolved",
      params: {
        requested_provider: provider.slug,
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
    router.push("/onboarding/export-guide/0")
  }

  return (
    <>
      {header}
      <RootPage scrollsUnderHeader lane="readable" style={styles.fill}>
        {(layout) => (
          <FlatList
            contentInsetAdjustmentBehavior="automatic"
            data={providers}
            keyExtractor={(provider) => provider.slug}
            contentContainerStyle={[layout.laneStyle, styles.content]}
            accessibilityLabel={instructions}
            ListHeaderComponent={
              <PageIntro
                title={t("exportGuide.provider.title")}
                caption={instructions}
                style={styles.intro}
              />
            }
            renderItem={({ item: provider, index }) => {
              const thumbnail = provider.thumbnail
              const imageFailed = failedImages.has(provider.slug)
              return (
                <ListRow
                  testID={`export-guide-provider-${provider.slug}`}
                  label={provider.label}
                  accessibilityLabel={provider.label}
                  hint={providerHint}
                  subtitle={
                    thumbnail !== undefined && imageFailed
                      ? t("exportGuide.imageUnavailable")
                      : undefined
                  }
                  leading={
                    thumbnail !== undefined && !imageFailed
                      ? {
                          element: (
                            <Image
                              source={{ uri: thumbnail.url }}
                              accessibilityLabel={thumbnail.altText}
                              accessibilityRole="image"
                              onError={() => {
                                setFailedImages((current) =>
                                  new Set(current).add(provider.slug),
                                )
                                emitExportGuideEvent({
                                  name: "export_guide_image_failed",
                                  params: {
                                    provider_slug: provider.slug,
                                    image_role: "thumbnail",
                                    failure: "load",
                                  },
                                })
                              }}
                              style={styles.thumbnail}
                            />
                          ),
                          width: THUMBNAIL,
                        }
                      : undefined
                  }
                  position={listRowPosition(index, providers.length)}
                  trailing="chevron"
                  onPress={() => select(provider, catalogue)}
                />
              )
            }}
          />
        )}
      </RootPage>
    </>
  )
}

const THUMBNAIL = 56

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingVertical: Spacing.four },
  intro: { marginBottom: Spacing.three },
  thumbnail: { width: THUMBNAIL, height: THUMBNAIL, borderRadius: Radii.small },
})
