import { Stack } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform } from "react-native"

import { type HeaderAction, useHeaderActions } from "@/components/chrome"
import { RootPage, ThemedText } from "@/design"
import type { GalleryKey, GalleryMeta, GalleryStory } from "@/design/gallery"

type Press = (name: string) => () => void

type HeaderActionFixtureProps = {
  caption: GalleryKey
  actions: (press: Press) => {
    left?: HeaderAction[]
    right?: HeaderAction[]
  }
}

type Story = GalleryStory<HeaderActionFixtureProps>

const todayIcon = { ios: "calendar", android: "today" } as const
const addIcon = { ios: "plus", android: "add" } as const

function HeaderActionFixture({ caption, actions }: HeaderActionFixtureProps) {
  const { t } = useTranslation()
  const [last, setLast] = useState<{ name: string; count: number } | null>(null)
  const press: Press = (name) => () =>
    setLast((previous) => ({
      name,
      count: previous?.name === name ? previous.count + 1 : 1,
    }))
  const headerActions = useHeaderActions(actions(press))
  return (
    <>
      <Stack.Screen options={headerActions} />
      <RootPage testID="gallery-header-action-page">
        <ThemedText>{t(caption)}</ThemedText>
        <ThemedText testID="gallery-header-action-last">
          {last
            ? t("gallery.headerAction.lastPressed", last)
            : t("gallery.headerAction.nonePressed")}
        </ThemedText>
      </RootPage>
    </>
  )
}

function IconsFixture() {
  const { t } = useTranslation()
  return (
    <HeaderActionFixture
      caption="gallery.headerAction.caption.icons"
      actions={(press) => ({
        right: [
          {
            icon: todayIcon,
            accessibilityLabel: t("gallery.headerAction.today"),
            testID: "gallery-header-action-today",
            onPress: press(t("gallery.headerAction.today")),
          },
          {
            icon: addIcon,
            accessibilityLabel: t("gallery.headerAction.add"),
            testID: "gallery-header-action-add",
            onPress: press(t("gallery.headerAction.add")),
          },
        ],
      })}
    />
  )
}

function TextFixture() {
  const { t } = useTranslation()
  return (
    <HeaderActionFixture
      caption="gallery.headerAction.caption.text"
      actions={(press) => ({
        right: [
          {
            label: t("gallery.headerAction.done"),
            accessibilityLabel: t("gallery.headerAction.done"),
            accessibilityHint: t("gallery.headerAction.doneHint"),
            testID: "gallery-header-action-done",
            onPress: press(t("gallery.headerAction.done")),
          },
        ],
      })}
    />
  )
}

function BothSidesFixture() {
  const { t } = useTranslation()
  return (
    <HeaderActionFixture
      caption="gallery.headerAction.caption.bothSides"
      actions={(press) => ({
        left: [
          {
            label: t("gallery.headerAction.cancel"),
            accessibilityLabel: t("gallery.headerAction.cancel"),
            testID: "gallery-header-action-cancel",
            onPress: press(t("gallery.headerAction.cancel")),
          },
        ],
        right: [
          {
            icon: addIcon,
            accessibilityLabel: t("gallery.headerAction.add"),
            testID: "gallery-header-action-add",
            onPress: press(t("gallery.headerAction.add")),
          },
        ],
      })}
    />
  )
}

function DisabledFixture() {
  const { t } = useTranslation()
  return (
    <HeaderActionFixture
      caption="gallery.headerAction.caption.disabled"
      actions={(press) => ({
        right: [
          {
            label: t("gallery.headerAction.done"),
            accessibilityLabel: t("gallery.headerAction.done"),
            testID: "gallery-header-action-done",
            disabled: true,
            onPress: press(t("gallery.headerAction.done")),
          },
        ],
      })}
    />
  )
}

function PlatformOnlyFixture() {
  const { t } = useTranslation()
  return (
    <HeaderActionFixture
      caption={
        Platform.OS === "ios"
          ? "gallery.headerAction.caption.platformOnlyIos"
          : "gallery.headerAction.caption.platformOnlyAndroid"
      }
      actions={(press) => ({
        right: [
          {
            label: t("gallery.headerAction.iosOnly"),
            accessibilityLabel: t("gallery.headerAction.iosOnly"),
            testID: "gallery-header-action-ios-only",
            platform: "ios",
            onPress: press(t("gallery.headerAction.iosOnly")),
          },
          {
            label: t("gallery.headerAction.androidOnly"),
            accessibilityLabel: t("gallery.headerAction.androidOnly"),
            testID: "gallery-header-action-android-only",
            platform: "android",
            onPress: press(t("gallery.headerAction.androidOnly")),
          },
        ],
      })}
    />
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  return (
    <HeaderActionFixture
      caption="gallery.headerAction.caption.longStrings"
      actions={(press) => ({
        right: [
          {
            label: t("gallery.stress.action"),
            accessibilityLabel: t("gallery.stress.action"),
            accessibilityHint: t("gallery.stress.title"),
            testID: "gallery-header-action-long-text",
            onPress: press(t("gallery.stress.action")),
          },
          {
            icon: addIcon,
            accessibilityLabel: t("gallery.headerAction.longLabel"),
            testID: "gallery-header-action-long-icon",
            onPress: press(t("gallery.headerAction.longLabel")),
          },
        ],
      })}
    />
  )
}

const meta: GalleryMeta<HeaderActionFixtureProps> = {
  id: "header-action",
  title: "gallery.headerAction.title",
  component: HeaderActionFixture,
  stories: [
    "Icons",
    "Text",
    "BothSides",
    "Disabled",
    "PlatformOnly",
    "LongStrings",
  ],
}

export default meta

export const Icons: Story = {
  name: "gallery.headerAction.story.icons",
  render: () => <IconsFixture />,
}

export const Text: Story = {
  name: "gallery.headerAction.story.text",
  render: () => <TextFixture />,
}

export const BothSides: Story = {
  name: "gallery.headerAction.story.bothSides",
  render: () => <BothSidesFixture />,
}

export const Disabled: Story = {
  name: "gallery.headerAction.story.disabled",
  render: () => <DisabledFixture />,
}

export const PlatformOnly: Story = {
  name: "gallery.headerAction.story.platformOnly",
  render: () => <PlatformOnlyFixture />,
}

export const LongStrings: Story = {
  name: "gallery.headerAction.story.longStrings",
  render: () => <LongStringsFixture />,
}
