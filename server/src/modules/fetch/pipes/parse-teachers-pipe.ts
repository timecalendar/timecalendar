import { EventTransformPipe } from "modules/fetch/pipes/event-transform-pipe"
import { parseFromDescriptionPipe } from "modules/fetch/pipes/parse-from-description-pipe"

const parseTeachersPipe: (regex?: RegExp) => EventTransformPipe = (
  regex = /^(([a-zA-Z-]{2,} )+[a-zA-Z-]{2,})$/,
) =>
  parseFromDescriptionPipe([
    {
      regex,
      field: "teachers",
      removeFromDescription: true,
    },
  ])

export default parseTeachersPipe
