import { Image } from "expo-image"
import { router, Stack } from "expo-router"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, Pressable, StyleSheet, View } from "react-native"

import { PageIntro, RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
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
import { Radii, Spacing, useTheme } from "@/theme"

import { GuideBlockingError, GuideLoading } from "./guide-status"
import { emitExportGuideEvent } from "./telemetry"
import { useExportGuideLoad } from "./use-export-guide-load"

export default function ProviderSelectionScreen() {
  const { t } = useTranslation()
  const theme = useTheme()
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
  if (state.phase === "blocked") {
    return <GuideBlockingError retry={retry} busy={busy} />
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
    return <GuideLoading />

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
      <Stack.Screen options={{ title: t("exportGuide.provider.title") }} />
      <RootPage lane="readable" style={styles.fill}>
        {(layout) => (
          <FlatList
            style={layout.laneStyle}
            data={providers}
            keyExtractor={(provider) => provider.slug}
            contentContainerStyle={styles.content}
            accessibilityLabel={instructions}
            ListHeaderComponent={<PageIntro caption={instructions} />}
            renderItem={({ item: provider }) => (
              <Pressable
                testID={`export-guide-provider-${provider.slug}`}
                accessibilityRole="button"
                accessibilityLabel={provider.label}
                accessibilityHint={providerHint}
                onPress={() => select(provider, catalogue)}
                style={[
                  styles.provider,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.separator,
                  },
                ]}
              >
                {provider.thumbnail !== undefined &&
                !failedImages.has(provider.slug) ? (
                  <Image
                    source={{ uri: provider.thumbnail.url }}
                    accessibilityLabel={provider.thumbnail.altText}
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
                ) : null}
                <View style={styles.label}>
                  <ThemedText type="smallBold">{provider.label}</ThemedText>
                  {provider.thumbnail !== undefined &&
                  failedImages.has(provider.slug) ? (
                    <ThemedText
                      themeColor="textSecondary"
                      accessibilityLabel={provider.thumbnail.altText}
                    >
                      {t("exportGuide.imageUnavailable")}
                    </ThemedText>
                  ) : null}
                </View>
              </Pressable>
            )}
          />
        )}
      </RootPage>
    </>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { gap: Spacing.three, paddingBottom: Spacing.four },
  provider: {
    minHeight: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radii.medium,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    gap: Spacing.three,
  },
  thumbnail: { width: 56, height: 56, borderRadius: Radii.small },
  label: { flex: 1, gap: Spacing.one },
})
