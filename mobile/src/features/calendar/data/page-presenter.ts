import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useHiddenEvents } from "@/features/hidden-events/data"
import { useColorScheme } from "@/hooks/use-color-scheme"

import {
  type CalendarWindowSnapshot,
  type PageEventFilter,
  selectPageEvents,
} from "./calendar-window-store"
import type { AppLocale } from "./format"
import { type PageIndex, pageKey, type PageSpace } from "./page-index"
import {
  buildPagePresentation,
  createPagePresentationCache,
  type PagePresentationCache,
  pagePresentationCacheKey,
  type PagePresentationEnvironment,
  type PagePresentationV1,
} from "./page-presentation"
import { useCalendarIncreasedContrast } from "./use-increased-contrast"
import { chunkOfPage } from "./window-chunks"

/** The frozen presentation of a page, built at most once per cache identity. */
export type PagePresenter = (index: PageIndex) => PagePresentationV1

export interface PagePresenterSource {
  snapshot: CalendarWindowSnapshot
  space: PageSpace
  filter: PageEventFilter
  filterRevision: number
  environment: PagePresentationEnvironment
  cache: PagePresentationCache
}

/**
 * The page's presentation from the cache, keyed by its chunk's status and
 * revision, so a cached page is returned without filtering its rows again.
 */
export function presentPage(
  source: PagePresenterSource,
  index: PageIndex,
): PagePresentationV1 {
  const { snapshot, space, environment } = source
  const entry = snapshot.chunks.get(chunkOfPage(space, index))
  const status = entry?.status ?? "loading"
  const key = pagePresentationCacheKey({
    pageKey: pageKey(space, index),
    status,
    rowsRevision:
      entry === undefined || entry.status === "loading" ? 0 : entry.revision,
    filterRevision: source.filterRevision,
    environment,
  })
  return source.cache.getOrCreate(key, () => {
    const page = selectPageEvents(snapshot, space, index, source.filter)
    return buildPagePresentation({
      space,
      index,
      status: page.status,
      events: page.events,
      checklist: page.checklist,
      environment,
    })
  })
}

interface FilterState {
  key: string
  filter: PageEventFilter
  revision: number
}

type HiddenLists = { uidHiddenEvents: string[]; namedHiddenEvents: string[] }

const hiddenKey = (hidden: HiddenLists) =>
  JSON.stringify([hidden.uidHiddenEvents, hidden.namedHiddenEvents])

function filterState(hidden: HiddenLists, revision: number): FilterState {
  return {
    key: hiddenKey(hidden),
    filter: {
      hiddenUids: new Set(hidden.uidHiddenEvents),
      hiddenNames: new Set(hidden.namedHiddenEvents),
    },
    revision,
  }
}

/** The Calendar screen's page presenter over its window snapshot. */
export function usePagePresenter(input: {
  snapshot: CalendarWindowSnapshot
  space: PageSpace
  locale: AppLocale
  displayZone: string
  showWeekends: boolean
}): PagePresenter {
  const { t } = useTranslation()
  const scheme = useColorScheme() === "dark" ? "dark" : "light"
  const increasedContrast = useCalendarIncreasedContrast()
  const hidden = useHiddenEvents()
  const [cache] = useState(() => createPagePresentationCache())
  const [filter, setFilter] = useState(() => filterState(hidden, 0))
  let current = filter
  if (hiddenKey(hidden) !== filter.key) {
    current = filterState(hidden, filter.revision + 1)
    setFilter(current)
  }
  const source: PagePresenterSource = {
    snapshot: input.snapshot,
    space: input.space,
    filter: current.filter,
    filterRevision: current.revision,
    environment: {
      locale: input.locale,
      displayZone: input.displayZone,
      showWeekends: input.showWeekends,
      scheme,
      increasedContrast,
      localizedNoTitle: t("calendar.event.noTitle"),
      t,
    },
    cache,
  }
  return (index) => presentPage(source, index)
}
