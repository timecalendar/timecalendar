import { fromZonedTime, toZonedTime } from "date-fns-tz"
import { useState } from "react"
import { Platform, Pressable, type StyleProp, StyleSheet } from "react-native"

import { DateTimePicker } from "@/components/chrome"
import { FieldInset, useFieldBoxStyle } from "@/design/field/field-box"
import { fieldErrorHint } from "@/design/field/field-error-hint"
import {
  FieldChrome,
  type TextFieldLayoutStyle,
} from "@/design/field/text-field"
import { ThemedText } from "@/design/text/themed-text"
import { useUses24HourClock } from "@/hooks/use-uses-24-hour-clock"
import { MinTouchTarget } from "@/theme"

export type DateTimeFieldProps = {
  label: string
  value: Date
  zone: string
  formatValue: (value: Date) => string
  onChange: (value: Date) => void
  error?: string | null | undefined
  disabled?: boolean
  testID?: string
  style?: StyleProp<TextFieldLayoutStyle>
}

type AndroidStep =
  | { kind: "closed" }
  | { kind: "date" }
  | { kind: "time"; pending: Date }

const onPicked =
  (commit: (date: Date) => void) => (_event: unknown, date: Date) =>
    commit(date)

// The Compose dialogs can confirm with no selection, surfacing an invalid or
// epoch Date; that is a cancel, not 1970.
function isPickedDate(date: Date): boolean {
  const time = date.getTime()
  return Number.isFinite(time) && time !== 0
}

// The chrome picker takes and reports device-local Dates (ADR 066); this field
// owns the display-zone conversion around it. Android's dialog picks a date or
// a time, never both, so the row chains a date dialog then a time dialog and
// commits them together; each dialog opens on mount, under its own key.
export function DateTimeField({
  label,
  value,
  zone,
  formatValue,
  onChange,
  error,
  disabled = false,
  testID,
  style,
}: DateTimeFieldProps) {
  const [step, setStep] = useState<AndroidStep>({ kind: "closed" })
  if (disabled && step.kind !== "closed") setStep({ kind: "closed" })
  const uses24HourClock = useUses24HourClock()
  const box = useFieldBoxStyle({ focused: false, error: Boolean(error) })
  const wallClock = toZonedTime(value, zone)
  const commit = (date: Date) => onChange(fromZonedTime(date, zone))

  if (Platform.OS !== "android") {
    return (
      <FieldChrome
        label={label}
        error={error}
        disabled={disabled}
        testID={testID}
        style={style}
      >
        <DateTimePicker
          {...(testID !== undefined ? { testID } : {})}
          mode="datetime"
          value={wallClock}
          disabled={disabled}
          alignment="leading"
          accessibilityLabel={label}
          onValueChange={onPicked(commit)}
        />
      </FieldChrome>
    )
  }

  // TalkBack reads a focusable node's name instead of its child text, so the
  // name carries the value.
  const display = formatValue(value)
  return (
    <FieldChrome
      label={label}
      error={error}
      disabled={disabled}
      testID={testID}
      style={style}
    >
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${display}`}
        accessibilityHint={fieldErrorHint(error)}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setStep({ kind: "date" })}
        style={StyleSheet.flatten([
          ...box.style,
          styles.row,
          {
            paddingHorizontal: FieldInset.horizontal - box.borderWidth,
            paddingVertical: FieldInset.vertical - box.borderWidth,
          },
        ])}
      >
        <ThemedText>{display}</ThemedText>
      </Pressable>
      {step.kind === "date" && (
        <DateTimePicker
          key="date"
          mode="date"
          presentation="dialog"
          value={wallClock}
          onValueChange={onPicked((day) =>
            setStep(
              isPickedDate(day)
                ? { kind: "time", pending: day }
                : { kind: "closed" },
            ),
          )}
          onDismiss={() => setStep({ kind: "closed" })}
        />
      )}
      {step.kind === "time" && (
        <DateTimePicker
          key="time"
          mode="time"
          presentation="dialog"
          value={step.pending}
          {...(uses24HourClock !== null ? { is24Hour: uses24HourClock } : {})}
          onValueChange={onPicked((date) => {
            setStep({ kind: "closed" })
            if (isPickedDate(date)) commit(date)
          })}
          onDismiss={() => setStep({ kind: "closed" })}
        />
      )}
    </FieldChrome>
  )
}

const styles = StyleSheet.create({
  row: {
    minHeight: MinTouchTarget,
    justifyContent: "center",
  },
})
