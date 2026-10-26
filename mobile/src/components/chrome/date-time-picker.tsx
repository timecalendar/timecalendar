import type { ComponentProps } from "react"
import { Platform } from "react-native"

import { composeDayOf, fromComposeDay } from "./compose-date-day"
import { ExpoDateTimePicker } from "./expo-ui"

export type DateTimePickerProps = ComponentProps<typeof ExpoDateTimePicker>

// Takes and reports device-local Dates on both platforms. The Android date
// picker speaks UTC-midnight days, so its day is converted here and the value's
// local time of day is kept. Invalid and epoch Dates are the Compose "no
// selection" confirm and pass through for the consumer to treat as a cancel.
export function DateTimePicker(props: DateTimePickerProps) {
  const { value, mode, onValueChange, onChange } = props
  if (Platform.OS !== "android" || mode === "time")
    return <ExpoDateTimePicker {...props} />

  const toLocal = (picked: Date) =>
    isPickedDay(picked) ? fromComposeDay(picked, value) : picked

  return (
    <ExpoDateTimePicker
      {...props}
      value={composeDayOf(value)}
      {...(onValueChange
        ? {
            onValueChange: (event, date) => onValueChange(event, toLocal(date)),
          }
        : {})}
      {...(onChange
        ? {
            onChange: (event, date) =>
              onChange(event, date === undefined ? date : toLocal(date)),
          }
        : {})}
    />
  )
}

function isPickedDay(date: Date): boolean {
  const time = date.getTime()
  return Number.isFinite(time) && time !== 0
}
