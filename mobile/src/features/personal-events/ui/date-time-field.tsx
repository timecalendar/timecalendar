import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { useState } from "react"
import { Platform, Pressable, StyleSheet } from "react-native"

import { DateTimePicker } from "@/components/chrome"
import { ThemedText } from "@/components/themed-text"
import { type AppLocale, formatShortDateTime } from "@/features/calendar/data"
import { Radii, Spacing, useTheme } from "@/theme"

import { dateDialogValue, mergePickedDay } from "./wall-clock-day"

// A compact, cross-platform date/time field over the @expo/ui DateTimePicker
// (the @/components/chrome seam — ADR 012), used by the personal-event form.
//
// iOS: @expo/ui's DateTimePicker already renders SwiftUI's compact tap-to-reveal
// field, so the feature-owned field renders it inline as-is.
//
// Android: @expo/ui's inline picker (presentation="inline") renders a full
// Material calendar that consumes the screen, and its dialog mode cannot pick a
// date and a time together. The field is a small tappable row showing the
// current value; a tap opens the native date dialog, then the native time
// dialog, and the two commit together as one wall clock. Cancelling either
// dialog leaves the value unchanged. Each dialog opens on mount (the @expo/ui
// Android contract), so only the current step's picker is mounted, under its
// own key so Compose never reuses the closed dialog.
//
// The picked wall clock is interpreted in the effective DISPLAY zone (timezone
// design D6): the native picker only speaks device-local Dates, so the stored
// instant round-trips through `toZonedTime` (instant → the zone's wall clock
// for the picker) and `fromZonedTime` (the picked wall clock → instant). Under
// the "system" preference both are identity — byte-for-byte today's behavior.

type AndroidStep =
  | { kind: "closed" }
  | { kind: "date" }
  | { kind: "time"; pending: Date }

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
  const [step, setStep] = useState<AndroidStep>({ kind: "closed" })

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
        onPress={() => setStep({ kind: "date" })}
        style={[styles.field, { backgroundColor: theme.backgroundElement }]}
      >
        <ThemedText>{formatShortDateTime(value, locale, zone)}</ThemedText>
      </Pressable>
      {step.kind === "date" && (
        <DateTimePicker
          key="date"
          mode="date"
          presentation="dialog"
          value={dateDialogValue(toZonedTime(value, zone))}
          onValueChange={(_event, day) =>
            setStep({
              kind: "time",
              pending: mergePickedDay(toZonedTime(value, zone), day),
            })
          }
          onDismiss={() => setStep({ kind: "closed" })}
        />
      )}
      {step.kind === "time" && (
        <DateTimePicker
          key="time"
          mode="time"
          presentation="dialog"
          value={step.pending}
          onValueChange={(_event, date) => {
            setStep({ kind: "closed" })
            onChange(fromZonedTime(date, zone))
          }}
          onDismiss={() => setStep({ kind: "closed" })}
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
