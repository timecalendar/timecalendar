import { forwardRef, useImperativeHandle, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"

import { dayKey, resolveLocale } from "@/features/calendar/data"
import {
  type CalendarTimelineHandle,
  type CalendarTimelineProps,
} from "@/features/calendar/renderer/types"
import { Spacing, useTheme } from "@/theme"

import { type CalendarKitEventItem, toCalendarKitEvent } from "./event-adapter"
import { CalendarKitAllDayTile, CalendarKitEventTile } from "./event-tiles"
import { buildCalendarKitTheme } from "./theme"
import {
  CalendarBody,
  CalendarContainer,
  CalendarHeader,
  type CalendarKitHandle,
} from "./vendor"

const GRID_PAGES_PER_SIDE = 4

export const CalendarKitTimeline = forwardRef<
  CalendarTimelineHandle,
  CalendarTimelineProps
>(function CalendarKitTimeline(
  {
    mode,
    anchorDate,
    displayZone,
    events,
    checklistProgress,
    startMinute,
    endMinute,
    showWeekends,
    bottomInset,
    onVisibleDateChange,
    onSettledDateChange,
    onPressEvent,
  },
  ref,
) {
  const { i18n } = useTranslation()
  const theme = useTheme()
  const calendarKitRef = useRef<CalendarKitHandle>(null)
  const locale = resolveLocale(i18n.language)
  const eventItems = useMemo(() => events.map(toCalendarKitEvent), [events])
  const calendarTheme = useMemo(() => buildCalendarKitTheme(theme), [theme])

  useImperativeHandle(ref, () => ({
    goToDate(date, options) {
      calendarKitRef.current?.goToDate({
        date: date.toISOString(),
        animatedDate: options?.animated ?? true,
        hourScroll: options?.scrollToCurrentTime ?? true,
      })
    },
  }))

  return (
    <CalendarContainer
      ref={calendarKitRef}
      numberOfDays={mode === "day" ? 1 : showWeekends ? 7 : 5}
      pagesPerSide={GRID_PAGES_PER_SIDE}
      timeZone={displayZone}
      initialDate={dayKey(anchorDate, displayZone)}
      start={startMinute}
      end={endMinute}
      events={eventItems}
      theme={calendarTheme}
      spaceFromBottom={Spacing.three + bottomInset}
      onChange={(iso) => onVisibleDateChange(new Date(iso))}
      onDateChanged={(iso) => onSettledDateChange(new Date(iso))}
      onPressEvent={(event) =>
        onPressEvent((event as CalendarKitEventItem).source)
      }
    >
      <CalendarHeader
        renderEvent={(event, size) => (
          <CalendarKitAllDayTile
            event={event}
            progress={checklistProgress.get(String(event.id))}
            width={size.width}
            height={size.height}
            locale={locale}
            zone={displayZone}
          />
        )}
      />
      <CalendarBody
        showNowIndicator
        renderEvent={(event, size) => (
          <CalendarKitEventTile
            event={event}
            progress={checklistProgress.get(String(event.id))}
            width={size.width}
            height={size.height}
            locale={locale}
            zone={displayZone}
          />
        )}
      />
    </CalendarContainer>
  )
})
