import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import { headerScrollProps } from "@/components/header-scroll-props"
import { RootPage } from "@/components/root-page"
import {
  type TextTone,
  ThemedText,
  type ThemedTextProps,
} from "@/components/themed-text"
import type { GalleryMeta, GalleryStory } from "@/design"
import {
  Radii,
  Spacing,
  type ThemeColor,
  TypeRamp,
  type TypeVariant,
  useTheme,
} from "@/theme"

type Story = GalleryStory<ThemedTextProps>

const rampSteps = {
  largeTitle: "heading",
  title: "heading",
  title2: "heading",
  sectionTitle: "heading",
  headline: "text",
  body: "text",
  callout: "text",
  label: "text",
  footnote: "text",
  caption: "text",
  captionSmall: "text",
} as const satisfies Record<TypeVariant, "heading" | "text">

const steps = Object.keys(rampSteps) as TypeVariant[]

const toneBackdrop = {
  primary: undefined,
  secondary: undefined,
  action: undefined,
  destructive: undefined,
  onPrimary: "primaryStrong",
} as const satisfies Record<TextTone, ThemeColor | undefined>

const tones = Object.keys(toneBackdrop) as TextTone[]

function Page({ children }: { children: ReactNode }) {
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

function RampFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      {steps.map((step) => (
        <ThemedText
          key={step}
          type={step}
          testID={`gallery-themed-text-${step}`}
        >
          {t("gallery.themedText.step", {
            step,
            size: TypeRamp[step].style.fontSize,
            lineHeight: TypeRamp[step].style.lineHeight,
          })}
        </ThemedText>
      ))}
    </Page>
  )
}

function ToneLines({ surface }: { surface: ThemeColor }) {
  const { t } = useTranslation()
  const theme = useTheme()
  return (
    <View style={[styles.block, { backgroundColor: theme[surface] }]}>
      {tones.map((tone) => {
        const backdrop = toneBackdrop[tone]
        return (
          <View
            key={tone}
            style={[
              styles.toneLine,
              backdrop ? { backgroundColor: theme[backdrop] } : null,
            ]}
          >
            <ThemedText
              tone={tone}
              testID={`gallery-themed-text-${surface}-${tone}`}
            >
              {t("gallery.themedText.tone", { tone, surface })}
            </ThemedText>
          </View>
        )
      })}
    </View>
  )
}

function TonesFixture() {
  return (
    <Page>
      <ToneLines surface="background" />
      <ToneLines surface="backgroundElement" />
    </Page>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      {steps.map((step) => (
        <ThemedText key={step} type={step}>
          {t(
            rampSteps[step] === "heading"
              ? "gallery.stress.title"
              : "gallery.stress.body",
          )}
        </ThemedText>
      ))}
      <ThemedText>{t("gallery.stress.word")}</ThemedText>
    </Page>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingTop: Spacing.four, gap: Spacing.three },
  block: {
    borderRadius: Radii.medium,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  toneLine: {
    borderRadius: Radii.small,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
})

const meta: GalleryMeta<ThemedTextProps> = {
  id: "themed-text",
  title: "gallery.themedText.title",
  component: ThemedText,
  stories: ["Ramp", "Tones", "LongStrings"],
}

export default meta

export const Ramp: Story = {
  name: "gallery.themedText.story.ramp",
  render: () => <RampFixture />,
}

export const Tones: Story = {
  name: "gallery.themedText.story.tones",
  render: () => <TonesFixture />,
}

export const LongStrings: Story = {
  name: "gallery.themedText.story.longStrings",
  render: () => <LongStringsFixture />,
}
