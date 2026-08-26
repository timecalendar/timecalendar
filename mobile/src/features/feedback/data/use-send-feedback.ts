import { useContactControllerSendMessage } from "@/api/generated/contact/contact"
import type { SendMessageDto } from "@/api/generated/timeCalendar.schemas"
import type {
  CalendarImportClassification,
  CalendarImportHelpKey,
} from "@/features/calendar-sources"
import { useUserCalendars } from "@/features/calendar-sources"
import type { ValidFeedbackForm } from "@/features/feedback/form"
import { useRecordedAction } from "@/hooks/use-recorded-action"

import { getDeviceInfo } from "./device-info"

export interface FeedbackContext {
  classification?: CalendarImportClassification
  helpKey?: CalendarImportHelpKey
}

export type SendFeedbackInput = ValidFeedbackForm & FeedbackContext

export function buildFeedbackDto(
  input: SendFeedbackInput,
  calendarIds: string[],
  deviceInfo: string,
): SendMessageDto {
  const recoveryClassification = input.classification
  const recoveryHelpKey = input.helpKey
  return {
    email: input.email,
    message: input.message,
    calendarIds,
    deviceInfo,
    ...(recoveryClassification ? { recoveryClassification } : {}),
    ...(recoveryHelpKey ? { recoveryHelpKey } : {}),
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
