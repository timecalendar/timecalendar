import { useTranslation } from "react-i18next"

import {
  Button,
  ButtonRow,
  type ButtonRowProps,
  RootPage,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { useIsAccessibilityTextSize } from "@/theme"

type Story = GalleryStory<ButtonRowProps>

const noop = () => {}

function LayoutCaption() {
  const { t } = useTranslation()
  const stacked = useIsAccessibilityTextSize()
  return (
    <ThemedText tone="secondary" testID="gallery-button-row-layout">
      {t(
        stacked
          ? "gallery.buttonRow.layout.stacked"
          : "gallery.buttonRow.layout.row",
      )}
    </ThemedText>
  )
}

function PairFixture() {
  const { t } = useTranslation()
  return (
    <RootPage>
      <LayoutCaption />
      <ButtonRow
        testID="gallery-button-row"
        secondary={
          <Button
            variant="outlined"
            label={t("common.back")}
            onPress={noop}
            testID="gallery-button-row-back"
          />
        }
        primary={
          <Button
            variant="filled"
            label={t("gallery.button.label")}
            onPress={noop}
            testID="gallery-button-row-continue"
          />
        }
      />
    </RootPage>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  return (
    <RootPage>
      <LayoutCaption />
      <ButtonRow
        testID="gallery-button-row"
        secondary={
          <Button
            variant="outlined"
            size="small"
            label={t("gallery.button.label")}
            onPress={noop}
            testID="gallery-button-long-row-short"
          />
        }
        primary={
          <Button
            variant="filled"
            size="small"
            label={t("gallery.stress.action")}
            onPress={noop}
            testID="gallery-button-long-row-long"
          />
        }
      />
    </RootPage>
  )
}

const meta: GalleryMeta<ButtonRowProps> = {
  id: "button-row",
  title: "gallery.buttonRow.title",
  component: ButtonRow,
  stories: ["Pair", "LongStrings"],
}

export default meta

export const Pair: Story = {
  name: "gallery.buttonRow.story.pair",
  render: () => <PairFixture />,
}

export const LongStrings: Story = {
  name: "gallery.buttonRow.story.longStrings",
  render: () => <LongStringsFixture />,
}
