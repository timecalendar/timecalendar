import { type ComponentProps, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet, View } from "react-native"

import { type MenuComponentRef, MenuView } from "@/components/chrome"
import { RootPage } from "@/components/root-page"
import { ThemedText } from "@/components/themed-text"
import type { GalleryMeta, GalleryStory } from "@/design"
import { MinTouchTarget, Radii, Spacing, useTheme } from "@/theme"

type Story = GalleryStory<ComponentProps<typeof MenuView>>

type MenuActions = ComponentProps<typeof MenuView>["actions"]

const CHOICES = ["day", "week", "agenda"] as const

type Choice = (typeof CHOICES)[number]

function MenuFixture({ variant }: { variant: "default" | "states" | "long" }) {
  const { t } = useTranslation()
  const theme = useTheme()
  const ref = useRef<MenuComponentRef>(null)
  const [choice, setChoice] = useState<Choice>("week")
  const [lastAction, setLastAction] = useState<string | null>(null)
  const long = variant === "long"
  const labels: Record<Choice, string> = {
    day: t(long ? "gallery.stress.action" : "gallery.menuView.choice.day"),
    week: t(long ? "gallery.stress.title" : "gallery.menuView.choice.week"),
    agenda: t(long ? "gallery.stress.word" : "gallery.menuView.choice.agenda"),
  }
  const choiceActions: MenuActions = CHOICES.map((value) => ({
    id: value,
    title: labels[value],
    ...(variant === "default"
      ? {}
      : { state: value === choice ? "on" : "off" }),
  }))
  const actions: MenuActions =
    variant === "states"
      ? [
          ...choiceActions,
          {
            id: "disabled",
            title: t("gallery.menuView.disabledAction"),
            attributes: { disabled: true },
          },
          {
            id: "delete",
            title: t("gallery.menuView.destructiveAction"),
            attributes: { destructive: true },
          },
          {
            id: "share",
            title: t("gallery.menuView.section"),
            displayInline: true,
            subactions: [
              { id: "share-link", title: t("gallery.menuView.shareLink") },
              { id: "share-file", title: t("gallery.menuView.shareFile") },
            ],
          },
        ]
      : choiceActions
  const actionTitles = new Map(
    actions
      .flatMap((action) => [action, ...(action.subactions ?? [])])
      .map((action) => [action.id, action.title]),
  )
  const triggerLabel = t("gallery.menuView.triggerLabel", {
    value: labels[choice],
  })

  const onPressAction = (id: string) => {
    if ((CHOICES as readonly string[]).includes(id)) setChoice(id as Choice)
    else setLastAction(id)
  }

  return (
    <RootPage>
      <View style={styles.stack}>
        <MenuView
          ref={ref}
          actions={actions}
          onPressAction={({ nativeEvent }) => onPressAction(nativeEvent.event)}
        >
          <Pressable
            testID="gallery-menu-trigger"
            accessibilityRole="button"
            accessibilityLabel={triggerLabel}
            accessibilityActions={[{ name: "activate" }]}
            onPress={() => ref.current?.show()}
            onAccessibilityAction={({ nativeEvent }) => {
              if (nativeEvent.actionName === "activate") ref.current?.show()
            }}
            style={[
              styles.trigger,
              { backgroundColor: theme.backgroundElement },
            ]}
          >
            <ThemedText type="label">{labels[choice]}</ThemedText>
          </Pressable>
        </MenuView>
        {lastAction === null ? null : (
          <ThemedText tone="secondary" testID="gallery-menu-last-action">
            {t("gallery.menuView.lastAction", {
              action: actionTitles.get(lastAction),
            })}
          </ThemedText>
        )}
      </View>
    </RootPage>
  )
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.three, alignItems: "flex-start" },
  trigger: {
    minHeight: MinTouchTarget,
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.pill,
  },
})

const meta: GalleryMeta<ComponentProps<typeof MenuView>> = {
  id: "menu-view",
  title: "gallery.menuView.title",
  component: MenuView,
  stories: ["Default", "States", "LongStrings"],
}

export default meta

export const Default: Story = {
  name: "gallery.menuView.story.default",
  render: () => <MenuFixture variant="default" />,
}

export const States: Story = {
  name: "gallery.menuView.story.states",
  render: () => <MenuFixture variant="states" />,
}

export const LongStrings: Story = {
  name: "gallery.menuView.story.longStrings",
  render: () => <MenuFixture variant="long" />,
}
