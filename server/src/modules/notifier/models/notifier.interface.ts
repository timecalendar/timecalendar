import { OnCalendarChangedPayload } from "modules/notifier/models/notifier"

export interface Notifier {
  onCalendarChanged(payload: OnCalendarChangedPayload): Promise<void>
}
