import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet } from "react-native"

import {
  DateTimeField,
  type DateTimeFieldProps,
  headerScrollProps,
  RootPage,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Spacing, useIsAccessibilityTextSize } from "@/theme"

type Story = GalleryStory<DateTimeFieldProps>

const DEVICE_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

const formatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: DEVICE_ZONE,
})

const formatValue = (value: Date) => formatter.format(value)

type FixtureProps = Pick<DateTimeFieldProps, "label" | "error" | "disabled">

function StatefulField(props: FixtureProps) {
  const [value, setValue] = useState(() => new Date(2030, 0, 2, 9, 30))
  return (
    <DateTimeField
      {...props}
      testID="gallery-date-time-field"
      value={value}
      zone={DEVICE_ZONE}
      formatValue={formatValue}
      onChange={setValue}
    />
  )
}

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
              testID="gallery-date-time-field-text-size"
            >
              {t(
                accessibilitySize
                  ? "gallery.textField.textSize.accessibility"
                  : "gallery.textField.textSize.standard",
              )}
            </ThemedText>
          ) : null}
          <StatefulField
            label={t(
              long ? "gallery.stress.title" : "gallery.dateTimeField.label",
            )}
            {...(error || long
              ? {
                  error: t(
                    long
                      ? "gallery.stress.body"
                      : "gallery.dateTimeField.error",
                  ),
                }
              : {})}
            disabled={disabled}
          />
        </ScrollView>
      )}
    </RootPage>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingTop: Spacing.four, gap: Spacing.four },
})

const meta: GalleryMeta<DateTimeFieldProps> = {
  id: "date-time-field",
  title: "gallery.dateTimeField.title",
  component: DateTimeField,
  stories: ["Default", "Error", "Disabled", "LongStrings"],
}

export default meta

export const Default: Story = {
  name: "gallery.dateTimeField.story.default",
  render: () => <Fixture />,
}

export const Error: Story = {
  name: "gallery.dateTimeField.story.error",
  render: () => <Fixture error />,
}

export const Disabled: Story = {
  name: "gallery.dateTimeField.story.disabled",
  render: () => <Fixture disabled />,
}

export const LongStrings: Story = {
  name: "gallery.dateTimeField.story.longStrings",
  render: () => <Fixture long />,
}
