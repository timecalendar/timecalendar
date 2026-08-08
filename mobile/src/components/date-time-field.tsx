import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { useState } from "react"
import { Platform, Pressable, StyleSheet } from "react-native"

import { DateTimePicker } from "@/components/chrome"
import { ThemedText } from "@/components/themed-text"
import { type AppLocale, formatShortDateTime } from "@/features/calendar/data"
import { Radii, Spacing, useTheme } from "@/theme"

// A compact, cross-platform date/time field over the @expo/ui DateTimePicker
// (the @/components/chrome seam — ADR 012), used by the personal-event form.
//
// iOS: @expo/ui's DateTimePicker already renders SwiftUI's compact tap-to-reveal
// field, so it is rendered inline as-is.
//
// Android: @expo/ui's inline picker (presentation="inline") renders a full
// Material calendar that consumes the screen and pushes the form's other
// controls (and the Save button) off the visible area. To bring Android in line
// with iOS's compact tap-to-open behaviour, we render a small tappable field
// showing the current value and open the native date dialog on demand. The
// dialog opens on mount (the @expo/ui Android contract), so it is mounted only
// while open and unmounted again on confirm/dismiss.
//
// The picked wall clock is interpreted in the effective DISPLAY zone (timezone
// design D6): the native picker only speaks device-local Dates, so the stored
// instant round-trips through `toZonedTime` (instant → the zone's wall clock
// for the picker) and `fromZonedTime` (the picked wall clock → instant). Under
// the "system" preference both are identity — byte-for-byte today's behavior.

type DateTimeFieldProps = {
  testID?: string
  accessibilityLabel?: string
  value: Date
  locale: AppLocale
  zone: string
  onChange: (date: Date) => void
}

export function DateTimeField({
  testID,
  accessibilityLabel,
  value,
  locale,
  zone,
  onChange,
}: DateTimeFieldProps) {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  if (Platform.OS !== "android") {
    return (
      <DateTimePicker
        {...(testID !== undefined ? { testID } : {})}
        mode="datetime"
        value={toZonedTime(value, zone)}
        onValueChange={(_event, date) => onChange(fromZonedTime(date, zone))}
      />
    )
  }

  return (
    <>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => setOpen(true)}
        style={[styles.field, { backgroundColor: theme.backgroundElement }]}
      >
        <ThemedText>{formatShortDateTime(value, locale, zone)}</ThemedText>
      </Pressable>
      {open && (
        <DateTimePicker
          mode="date"
          presentation="dialog"
          value={toZonedTime(value, zone)}
          onValueChange={(_event, date) => {
            onChange(fromZonedTime(date, zone))
            setOpen(false)
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  field: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.medium,
  },
})
