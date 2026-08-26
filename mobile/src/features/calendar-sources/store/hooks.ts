import { useParsedStoredString } from "@/storage"

import {
  type CalendarSourceHealthSnapshot,
  parseSourceHealthSnapshot,
  SOURCE_HEALTH_KEY,
} from "./types"

export function useSourceHealthSnapshot(): CalendarSourceHealthSnapshot {
  return useParsedStoredString(SOURCE_HEALTH_KEY, parseSourceHealthSnapshot)
}
