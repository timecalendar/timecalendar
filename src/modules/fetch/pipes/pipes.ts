import { EventTransformPipe } from "./event-transform-pipe"
import generateUidPipe from "./generate-uid-pipe"
import removeExportedAtPipe from "./remove-exported-at-pipe"

export const defaultPipes: EventTransformPipe[] = [
  generateUidPipe,
  removeExportedAtPipe,
]
