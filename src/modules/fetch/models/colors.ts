import { EventType } from "./event"

const colors: { [type in EventType]: string } = {
  [EventType.CM]: "#d7d0fc",
  [EventType.TD]: "#c2f2d7",
  [EventType.TP]: "#fbc994",
  [EventType.TP2]: "#fbab94",
  [EventType.PROJECT]: "#fb94b8",
  [EventType.EXAM]: "#fb9994",
  [EventType.CLASS]: "#fcd0e2",
}

export default colors
