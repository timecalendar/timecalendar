import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet } from "react-native"

import {
  ColorSwatchField,
  type ColorSwatchFieldProps,
  headerScrollProps,
  RootPage,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Spacing, useIsAccessibilityTextSize } from "@/theme"

type Story = GalleryStory<ColorSwatchFieldProps>

const COLORS = [
  ["#E91E63", "gallery.colorSwatchField.color.pink"],
  ["#9C27B0", "gallery.colorSwatchField.color.purple"],
  ["#3F51B5", "gallery.colorSwatchField.color.indigo"],
  ["#03A9F4", "gallery.colorSwatchField.color.lightBlue"],
  ["#009688", "gallery.colorSwatchField.color.teal"],
  ["#4CAF50", "gallery.colorSwatchField.color.green"],
  ["#FF9800", "gallery.colorSwatchField.color.orange"],
  ["#795548", "gallery.colorSwatchField.color.brown"],
] as const

function Fixture({
  long = false,
  error = false,
  disabled = false,
}: {
  long?: boolean
  error?: boolean
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const accessibilitySize = useIsAccessibilityTextSize()
  const [value, setValue] = useState<string>(COLORS[0][0])
  const options = COLORS.map(([color, key]) => ({ color, label: t(key) }))
  return (
    <RootPage scrollsUnderHeader>
      {({ laneStyle }) => (
        <ScrollView
          {...headerScrollProps(true)}
          contentContainerStyle={[laneStyle, styles.scroll]}
        >
          {long ? (
            <ThemedText
              tone="secondary"
              testID="gallery-color-swatch-field-text-size"
            >
              {t(
                accessibilitySize
                  ? "gallery.textField.textSize.accessibility"
                  : "gallery.textField.textSize.standard",
              )}
            </ThemedText>
          ) : null}
          <ColorSwatchField
            testID="gallery-color-swatch-field"
            label={t(
              long ? "gallery.stress.title" : "gallery.colorSwatchField.label",
            )}
            options={options}
            value={value}
            onChange={setValue}
            disabled={disabled}
            error={
              long
                ? t("gallery.stress.body")
                : error
                  ? t("gallery.colorSwatchField.error")
                  : null
            }
          />
        </ScrollView>
      )}
    </RootPage>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingTop: Spacing.four, gap: Spacing.four },
})

const meta: GalleryMeta<ColorSwatchFieldProps> = {
  id: "color-swatch-field",
  title: "gallery.colorSwatchField.title",
  component: ColorSwatchField,
  stories: ["Default", "Error", "Disabled", "LongStrings"],
}

export default meta

export const Default: Story = {
  name: "gallery.colorSwatchField.story.default",
  render: () => <Fixture />,
}

export const Error: Story = {
  name: "gallery.colorSwatchField.story.error",
  render: () => <Fixture error />,
}

export const Disabled: Story = {
  name: "gallery.colorSwatchField.story.disabled",
  render: () => <Fixture disabled />,
}

export const LongStrings: Story = {
  name: "gallery.colorSwatchField.story.longStrings",
  render: () => <Fixture long />,
}
