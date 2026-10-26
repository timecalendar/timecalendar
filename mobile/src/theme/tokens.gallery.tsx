import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import { headerScrollProps } from "@/components/header-scroll-props"
import { Icon } from "@/components/icon"
import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import type { GalleryMeta, GalleryStory } from "@/design"
import { useColorScheme } from "@/hooks/use-color-scheme"
import {
  Colors as ColorTokens,
  Elevation as ElevationTokens,
  IconSize,
  Radii as RadiusTokens,
  Spacing as SpacingTokens,
  type ThemeColor,
  useTheme,
} from "@/theme"
import { contrastRatio, documentedContrastPairs } from "@/theme/contrast"

type TokenSwatchProps = {
  name: string
  detail: string
  accessibilityLabel: string
  children: ReactNode
}

type Story = GalleryStory<TokenSwatchProps>

const schemes = ["light", "dark"] as const

const roles = Object.keys(ColorTokens.light) as ThemeColor[]

function TokenSwatch({
  name,
  detail,
  accessibilityLabel,
  children,
}: TokenSwatchProps) {
  const theme = useTheme()
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      testID={`gallery-token-${name}`}
      style={[styles.row, { borderBottomColor: theme.separator }]}
    >
      <View style={styles.visual}>{children}</View>
      <View style={styles.text}>
        <ThemedText type="label">{name}</ThemedText>
        <ThemedText type="footnote" tone="secondary">
          {detail}
        </ThemedText>
      </View>
    </View>
  )
}

function TokenPage({ children }: { children: ReactNode }) {
  return (
    <RootPage scrollsUnderHeader>
      {({ laneStyle }) => (
        <ScrollView
          {...headerScrollProps(true)}
          contentContainerStyle={[laneStyle, styles.scroll]}
        >
          {children}
        </ScrollView>
      )}
    </RootPage>
  )
}

function Swatch({
  scheme,
  role,
}: {
  scheme: "light" | "dark"
  role: ThemeColor
}) {
  return (
    <View
      style={[
        styles.swatchTile,
        { backgroundColor: ColorTokens[scheme].background },
      ]}
    >
      <View
        style={[
          styles.swatch,
          {
            backgroundColor: ColorTokens[scheme][role],
            borderColor: ColorTokens[scheme].separator,
          },
        ]}
      />
    </View>
  )
}

function ColorsFixture() {
  const { t } = useTranslation()
  return (
    <TokenPage>
      {roles.map((role) => {
        const light = ColorTokens.light[role]
        const dark = ColorTokens.dark[role]
        return (
          <TokenSwatch
            key={role}
            name={role}
            detail={t("gallery.designTokens.colorDetail", { light, dark })}
            accessibilityLabel={t("gallery.designTokens.colorRow", {
              name: role,
              light,
              dark,
            })}
          >
            <Swatch scheme="light" role={role} />
            <Swatch scheme="dark" role={role} />
          </TokenSwatch>
        )
      })}
    </TokenPage>
  )
}

function ContrastPairsFixture() {
  const { t, i18n } = useTranslation()
  return (
    <TokenPage>
      {schemes.map((scheme) => (
        <View key={scheme} style={styles.group}>
          <ThemedText type="sectionTitle">
            {t(`gallery.designTokens.scheme.${scheme}`)}
          </ThemedText>
          {documentedContrastPairs
            .filter((pair) => pair.scheme === scheme)
            .map(({ foreground, background, floor }) => {
              const palette = ColorTokens[scheme]
              const ratio = contrastRatio(
                palette[foreground],
                palette[background],
              ).toLocaleString(i18n.language, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
              const floorLabel = t(`gallery.designTokens.floor.${floor}`)
              return (
                <TokenSwatch
                  key={`${foreground}-${background}`}
                  name={t("gallery.designTokens.pairName", {
                    foreground,
                    background,
                  })}
                  detail={t("gallery.designTokens.pairDetail", {
                    ratio,
                    floor: floorLabel,
                  })}
                  accessibilityLabel={t("gallery.designTokens.contrastRow", {
                    foreground,
                    background,
                    ratio,
                    floor: floorLabel,
                  })}
                >
                  <View
                    style={[
                      styles.sampleTile,
                      { backgroundColor: palette[background] },
                    ]}
                  >
                    <ThemedText
                      type="headline"
                      style={{ color: palette[foreground] }}
                    >
                      {t("gallery.designTokens.sample")}
                    </ThemedText>
                  </View>
                </TokenSwatch>
              )
            })}
        </View>
      ))}
    </TokenPage>
  )
}

function ScaleFixture({
  scale,
  visual,
}: {
  scale: Readonly<Record<string, number>>
  visual: (value: number) => ReactNode
}) {
  const { t } = useTranslation()
  return (
    <TokenPage>
      {Object.entries(scale).map(([name, value]) => (
        <TokenSwatch
          key={name}
          name={name}
          detail={String(value)}
          accessibilityLabel={t("gallery.designTokens.scaleRow", {
            name,
            value,
          })}
        >
          {visual(value)}
        </TokenSwatch>
      ))}
    </TokenPage>
  )
}

function SpacingBar({ value }: { value: number }) {
  const theme = useTheme()
  return (
    <View
      style={[styles.bar, { width: value, backgroundColor: theme.primary }]}
    />
  )
}

function RadiusSquare({ value }: { value: number }) {
  const theme = useTheme()
  return (
    <View
      style={[
        styles.square,
        { borderRadius: value, backgroundColor: theme.primarySoft },
      ]}
    />
  )
}

function IconSample({ value }: { value: number }) {
  const theme = useTheme()
  return (
    <Icon
      ios="calendar"
      android="today"
      size={value}
      color={theme.text}
      scaling="fixed"
    />
  )
}

function ElevationFixture() {
  const { t } = useTranslation()
  const theme = useTheme()
  const scheme = useColorScheme() === "dark" ? "dark" : "light"
  return (
    <TokenPage>
      {Object.entries(ElevationTokens).map(([name, shadows]) => (
        <TokenSwatch
          key={name}
          name={name}
          detail={shadows[scheme]}
          accessibilityLabel={t("gallery.designTokens.elevationRow", {
            name,
            value: shadows[scheme],
          })}
        >
          <View
            style={[
              styles.square,
              {
                backgroundColor: theme.backgroundElement,
                boxShadow: shadows[scheme],
              },
            ]}
          />
        </TokenSwatch>
      ))}
    </TokenPage>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingTop: SpacingTokens.four, gap: SpacingTokens.two },
  group: { gap: SpacingTokens.two, marginBottom: SpacingTokens.four },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SpacingTokens.three,
    paddingVertical: SpacingTokens.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  visual: {
    flexDirection: "row",
    alignItems: "center",
    gap: SpacingTokens.two,
    minWidth: 96,
  },
  text: { flex: 1, gap: SpacingTokens.half },
  swatchTile: { padding: SpacingTokens.one, borderRadius: RadiusTokens.medium },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: RadiusTokens.small,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sampleTile: {
    minWidth: 64,
    alignItems: "center",
    paddingVertical: SpacingTokens.two,
    borderRadius: RadiusTokens.medium,
  },
  bar: { height: SpacingTokens.three, borderRadius: RadiusTokens.small },
  square: { width: 48, height: 48 },
})

const meta: GalleryMeta<TokenSwatchProps> = {
  id: "design-tokens",
  title: "gallery.designTokens.title",
  component: TokenSwatch,
  stories: [
    "Colors",
    "ContrastPairs",
    "Spacing",
    "Radii",
    "IconSizes",
    "Elevation",
  ],
}

export default meta

export const Colors: Story = {
  name: "gallery.designTokens.story.colors",
  render: () => <ColorsFixture />,
}

export const ContrastPairs: Story = {
  name: "gallery.designTokens.story.contrastPairs",
  render: () => <ContrastPairsFixture />,
}

export const Spacing: Story = {
  name: "gallery.designTokens.story.spacing",
  render: () => (
    <ScaleFixture
      scale={SpacingTokens}
      visual={(value) => <SpacingBar value={value} />}
    />
  ),
}

export const Radii: Story = {
  name: "gallery.designTokens.story.radii",
  render: () => (
    <ScaleFixture
      scale={RadiusTokens}
      visual={(value) => <RadiusSquare value={value} />}
    />
  ),
}

export const IconSizes: Story = {
  name: "gallery.designTokens.story.iconSizes",
  render: () => (
    <ScaleFixture
      scale={IconSize}
      visual={(value) => <IconSample value={value} />}
    />
  ),
}

export const Elevation: Story = {
  name: "gallery.designTokens.story.elevation",
  render: () => <ElevationFixture />,
}
