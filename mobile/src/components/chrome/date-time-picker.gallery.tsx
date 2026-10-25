import { type ComponentProps, useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, StyleSheet, View } from "react-native"

import {
  DateTimePicker,
  NativeSettingsHost,
  NativeSettingsRow,
  NativeSettingsSection,
} from "@/components/chrome"
import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import type { GalleryMeta, GalleryStory } from "@/design"
import { Spacing } from "@/theme"

type PickerProps = ComponentProps<typeof DateTimePicker>

type Story = GalleryStory<PickerProps>

type Mode = "date" | "time" | "datetime"

const initialValue = () => new globalThis.Date(2030, 0, 2, 9, 30)

const bounds = {
  minimumDate: new globalThis.Date(2030, 0, 1),
  maximumDate: new globalThis.Date(2030, 0, 31, 23, 59),
}

const formats: Record<Mode, Intl.DateTimeFormatOptions> = {
  date: { dateStyle: "medium" },
  time: { timeStyle: "short" },
  datetime: { dateStyle: "medium", timeStyle: "short" },
}

function PickerFixture({
  mode,
  bounded = false,
  disabled = false,
}: {
  mode: Mode
  bounded?: boolean
  disabled?: boolean
}) {
  const { t, i18n } = useTranslation()
  const [value, setValue] = useState(initialValue)
  const [open, setOpen] = useState(true)
  const display = new Intl.DateTimeFormat(i18n.language, formats[mode]).format(
    value,
  )
  const range = bounded ? bounds : {}

  if (Platform.OS === "ios") {
    return (
      <RootPage>
        <View style={styles.stack}>
          <ThemedText type="label">
            {t("gallery.dateTimePicker.label")}
          </ThemedText>
          <DateTimePicker
            testID="gallery-date-time-picker"
            mode={mode}
            value={value}
            disabled={disabled}
            {...range}
            onValueChange={(_event, date) => setValue(date)}
          />
          <ThemedText tone="secondary" testID="gallery-date-time-value">
            {display}
          </ThemedText>
        </View>
      </RootPage>
    )
  }

  return (
    <>
      <NativeSettingsHost>
        <NativeSettingsSection>
          <NativeSettingsRow
            kind="action"
            label={t("gallery.dateTimePicker.label")}
            value={display}
            onPress={() => setOpen(true)}
            testID="gallery-date-time-open"
          />
        </NativeSettingsSection>
      </NativeSettingsHost>
      {open ? (
        <DateTimePicker
          testID="gallery-date-time-picker"
          mode={mode}
          presentation="dialog"
          value={value}
          {...range}
          positiveButton={{ label: t("gallery.dateTimePicker.confirm") }}
          negativeButton={{ label: t("gallery.dateTimePicker.cancel") }}
          onValueChange={(_event, date) => {
            setValue(date)
            setOpen(false)
          }}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.two },
})

const meta: GalleryMeta<PickerProps> = {
  id: "date-time-picker",
  title: "gallery.dateTimePicker.title",
  component: DateTimePicker,
  stories: ["Date", "Time", "DateTime", "Bounded", "Disabled"],
}

export default meta

export const Date: Story = {
  name: "gallery.dateTimePicker.story.date",
  render: () => <PickerFixture mode="date" />,
}

export const Time: Story = {
  name: "gallery.dateTimePicker.story.time",
  render: () => <PickerFixture mode="time" />,
}

export const DateTime: Story = {
  name: "gallery.dateTimePicker.story.dateTime",
  render: () => <PickerFixture mode="datetime" />,
  platforms: ["ios"],
}

export const Bounded: Story = {
  name: "gallery.dateTimePicker.story.bounded",
  render: () => <PickerFixture mode="date" bounded />,
}

export const Disabled: Story = {
  name: "gallery.dateTimePicker.story.disabled",
  render: () => <PickerFixture mode="datetime" disabled />,
  platforms: ["ios"],
}
