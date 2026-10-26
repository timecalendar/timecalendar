import { DatePicker, type DatePickerProps, Host } from "@expo/ui/swift-ui"
import {
  datePickerStyle,
  disabled as disabledModifier,
  environment,
  frame,
  labelsHidden,
  type ModifierConfig,
  tint,
} from "@expo/ui/swift-ui/modifiers"

import type { DateTimePickerProps } from "./date-time-picker"

const DISPLAYED_COMPONENTS = {
  date: ["date"],
  time: ["hourAndMinute"],
  datetime: ["date", "hourAndMinute"],
} as const satisfies Record<
  NonNullable<DateTimePickerProps["mode"]>,
  DatePickerProps["displayedComponents"]
>

function pickerStyle(display: DateTimePickerProps["display"]) {
  switch (display) {
    case "spinner":
      return "wheel"
    case "compact":
      return "compact"
    case "inline":
      return "graphical"
    default:
      return "automatic"
  }
}

// The community component's iOS path, composed here so it can take a frame
// and a name: its Host takes the row's width and SwiftUI centres the pills in
// it. Keep the prop mapping in step with
// @expo/ui/src/community/datetime-picker/DateTimePicker.tsx.
export function IosDateTimePicker({
  value,
  onChange,
  onValueChange,
  mode = "date",
  minimumDate,
  maximumDate,
  display,
  testID,
  style,
  accentColor,
  disabled,
  locale,
  themeVariant,
  timeZoneName,
  alignment,
  accessibilityLabel,
}: DateTimePickerProps) {
  const modifiers: ModifierConfig[] = [datePickerStyle(pickerStyle(display))]
  if (accentColor) modifiers.push(tint(accentColor))
  if (disabled !== undefined) modifiers.push(disabledModifier(disabled))
  if (locale) modifiers.push(environment("locale", locale))
  if (themeVariant) modifiers.push(environment("colorScheme", themeVariant))
  if (timeZoneName) modifiers.push(environment("timeZone", timeZoneName))
  if (alignment === "leading")
    modifiers.push(frame({ maxWidth: Infinity, alignment: "leading" }))
  if (accessibilityLabel !== undefined) modifiers.push(labelsHidden())

  const onDateChange = (date: Date) => {
    const nativeEvent = {
      timestamp: date.getTime(),
      utcOffset: -date.getTimezoneOffset(),
    }
    if (onValueChange) onValueChange({ nativeEvent }, date)
    else onChange?.({ type: "set", nativeEvent }, date)
  }

  return (
    <Host matchContents={{ vertical: true }} style={style} ignoreSafeArea="all">
      <DatePicker
        selection={value}
        displayedComponents={[...DISPLAYED_COMPONENTS[mode]]}
        {...(minimumDate || maximumDate
          ? {
              range: {
                ...(minimumDate ? { start: minimumDate } : {}),
                ...(maximumDate ? { end: maximumDate } : {}),
              },
            }
          : {})}
        {...(accessibilityLabel !== undefined
          ? { title: accessibilityLabel }
          : {})}
        {...(testID !== undefined ? { testID } : {})}
        onDateChange={onDateChange}
        modifiers={modifiers}
      />
    </Host>
  )
}
