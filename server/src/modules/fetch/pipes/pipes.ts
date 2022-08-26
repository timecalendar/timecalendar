import { EventTransformPipe } from "modules/fetch/pipes/event-transform-pipe"
import generateUidPipe from "modules/fetch/pipes/generate-uid-pipe"
import removeExportedAtPipe from "modules/fetch/pipes/remove-exported-at-pipe"

export const defaultPipes: EventTransformPipe[] = [
  generateUidPipe,
  removeExportedAtPipe,
]
