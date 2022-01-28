import colors from "modules/fetch/models/colors"
import { EventType } from "modules/fetch/models/event"

const eventTags = {
  td: { name: "TD", color: colors[EventType.TD], icon: "users-class" },
  tp: { name: "TP", color: colors[EventType.TP], icon: "pencil-paintbrush" },
  pers: { name: "PERS", color: colors[EventType.TP2], icon: "user-graduate" },
  project: { name: "Projet", color: colors[EventType.PROJECT], icon: "shapes" },
  exam: {
    name: "Examen",
    color: colors[EventType.EXAM],
    icon: "file-signature",
  },
  cm: { name: "CM", color: colors[EventType.CM], icon: "chalkboard-teacher" },
}

export default eventTags
