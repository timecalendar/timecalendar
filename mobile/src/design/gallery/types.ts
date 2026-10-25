import type { ComponentType, ReactElement } from "react"

import type en from "@/i18n/locales/en.json"

export type GalleryKey = Extract<keyof typeof en, `gallery.${string}`>

export type GalleryMeta<P> = {
  id: string
  title: GalleryKey
  component: ComponentType<P>
}

export type GalleryStory<P> = {
  name: GalleryKey
  args?: Partial<P>
  render?: (args: Partial<P>) => ReactElement
}

type ErasedProps = Record<string, unknown>

export type GalleryModule = {
  default: Omit<GalleryMeta<never>, "component"> & { component: unknown }
} & Record<string, unknown>

export type GalleryEntry = {
  id: string
  metaId: string
  title: GalleryKey
  name: GalleryKey
  story: GalleryStory<ErasedProps>
  component: ComponentType<ErasedProps>
}
