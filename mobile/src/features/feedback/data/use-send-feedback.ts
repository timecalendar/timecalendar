import { useContactControllerSendMessage } from "@/api/generated/contact/contact"
import type { SendMessageDto } from "@/api/generated/timeCalendar.schemas"
import { useUserCalendars } from "@/features/calendar-sources"
import type { ValidFeedbackForm } from "@/features/feedback/form"
import { useRecordedAction } from "@/hooks/use-recorded-action"

import { getDeviceInfo } from "./device-info"

export interface FeedbackContext {
  calendarUrl?: string
  schoolId?: string
  schoolName?: string
}

export type SendFeedbackInput = ValidFeedbackForm & FeedbackContext

function optional(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

export function buildFeedbackDto(
  input: SendFeedbackInput,
  calendarIds: string[],
  deviceInfo: string,
): SendMessageDto {
  const calendarUrl = optional(input.calendarUrl)
  const schoolId = optional(input.schoolId)
  const schoolName = optional(input.schoolName)
  return {
    email: input.email,
    message: input.message,
    calendarIds,
    deviceInfo,
    ...(calendarUrl ? { calendarUrl } : {}),
    ...(schoolId ? { schoolId } : {}),
    ...(schoolName ? { schoolName } : {}),
  }
}

export function useSendFeedback() {
  const calendars = useUserCalendars()
  const mutation = useContactControllerSendMessage()
  const { run, failed } = useRecordedAction()

  return {
    isPending: mutation.isPending,
    failed,
    reset: mutation.reset,
    sendFeedback: (input: SendFeedbackInput) =>
      run("feedback/contact-submit", () =>
        mutation.mutateAsync({
          data: buildFeedbackDto(
            input,
            calendars.map((calendar) => calendar.id),
            getDeviceInfo(),
          ),
        }),
      ),
  }
}
