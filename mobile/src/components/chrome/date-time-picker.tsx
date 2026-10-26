import type { ComponentProps } from "react"
import { Platform } from "react-native"

import { composeDayOf, fromComposeDay } from "./compose-date-day"
import { ExpoDateTimePicker } from "./expo-ui"

export type DateTimePickerProps = ComponentProps<typeof ExpoDateTimePicker>

// Takes and reports device-local Dates on both platforms, with events that
// describe the reported Date. The Android date picker speaks UTC-midnight days,
// so its day is converted here, the value's local time of day is kept, and the
// event is rebuilt from the converted Date. Invalid and epoch Dates are the
// Compose "no selection" confirm and pass through with their event, for the
// consumer to treat as a cancel.
export function DateTimePicker(props: DateTimePickerProps) {
  const { value, mode, onValueChange, onChange } = props
  if (Platform.OS !== "android" || mode === "time")
    return <ExpoDateTimePicker {...props} />

  function toLocal<Event extends { nativeEvent: object }>(
    event: Event,
    picked: Date,
  ): [Event, Date] {
    if (!isPickedDay(picked)) return [event, picked]
    const local = fromComposeDay(picked, value)
    return [
      {
        ...event,
        nativeEvent: {
          ...event.nativeEvent,
          timestamp: local.getTime(),
          utcOffset: -local.getTimezoneOffset(),
        },
      },
      local,
    ]
  }

  return (
    <ExpoDateTimePicker
      {...props}
      value={composeDayOf(value)}
      {...(onValueChange
        ? {
            onValueChange: (event, date) =>
              onValueChange(...toLocal(event, date)),
          }
        : {})}
      {...(onChange
        ? {
            onChange: (event, date) =>
              date === undefined
                ? onChange(event, date)
                : onChange(...toLocal(event, date)),
          }
        : {})}
    />
  )
}

function isPickedDay(date: Date): boolean {
  const time = date.getTime()
  return Number.isFinite(time) && time !== 0
}
