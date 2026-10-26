import { type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"

import {
  Button,
  type ButtonIcon,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
  headerScrollProps,
  RootPage,
  ThemedText,
} from "@/design"
import type { GalleryMeta, GalleryStory } from "@/design/gallery"
import { Spacing } from "@/theme"

type Story = GalleryStory<ButtonProps>

type State = "enabled" | "disabled" | "busy"

const sizes: readonly ButtonSize[] = ["small", "medium", "large"]
const states: readonly State[] = ["enabled", "disabled", "busy"]
const variants: readonly ButtonVariant[] = [
  "filled",
  "tonal",
  "outlined",
  "text",
  "destructive",
]

const plus: ButtonIcon = { ios: "plus", android: "add" }
const forward: ButtonIcon = { ios: "arrow.forward", android: "arrow_forward" }

type SampleProps = Pick<
  ButtonProps,
  "variant" | "size" | "icon" | "iconPosition" | "onPress" | "style"
> & {
  state?: State
  label?: string
  testID: string
}

function Sample({
  variant,
  size = "medium",
  state = "enabled",
  label,
  ...rest
}: SampleProps) {
  const { t } = useTranslation()
  const text = label ?? t("gallery.button.label")
  return (
    <Button
      {...rest}
      variant={variant}
      size={size}
      label={text}
      accessibilityLabel={t("gallery.button.a11y", {
        label: text,
        variant: t(`gallery.button.story.${variant}`),
        size: t(`gallery.button.size.${size}`),
        state: t(`gallery.button.state.${state}`),
      })}
      disabled={state === "disabled"}
      busy={state === "busy"}
    />
  )
}

function Page({ children }: { children: (onPress: () => void) => ReactNode }) {
  const { t } = useTranslation()
  const [count, setCount] = useState(0)
  const onPress = () => setCount((value) => value + 1)
  return (
    <RootPage scrollsUnderHeader>
      {({ laneStyle }) => (
        <ScrollView
          {...headerScrollProps(true)}
          contentContainerStyle={[laneStyle, styles.scroll]}
        >
          {children(onPress)}
          <ThemedText tone="secondary" testID="gallery-button-count">
            {t("gallery.pressCount", { count })}
          </ThemedText>
        </ScrollView>
      )}
    </RootPage>
  )
}

function VariantFixture({ variant }: { variant: ButtonVariant }) {
  return (
    <Page>
      {(onPress) =>
        sizes.map((size) => (
          <View key={size} style={styles.group}>
            {states.map((state) => (
              <Sample
                key={state}
                variant={variant}
                size={size}
                state={state}
                testID={`gallery-button-${variant}-${size}-${state}`}
                onPress={onPress}
              />
            ))}
          </View>
        ))
      }
    </Page>
  )
}

function IconsFixture() {
  const { t } = useTranslation()
  return (
    <Page>
      {(onPress) => (
        <>
          {variants.map((variant) => (
            <Sample
              key={variant}
              variant={variant}
              label={t(`gallery.button.story.${variant}`)}
              icon={plus}
              testID={`gallery-button-icon-${variant}`}
              onPress={onPress}
            />
          ))}
          <Sample
            variant="text"
            size="small"
            icon={forward}
            iconPosition="trailing"
            testID="gallery-button-trailing-text"
            onPress={onPress}
          />
          <Sample
            variant="outlined"
            icon={forward}
            iconPosition="trailing"
            testID="gallery-button-trailing-outlined"
            onPress={onPress}
          />
          <Sample
            variant="filled"
            state="busy"
            icon={plus}
            testID="gallery-button-icon-busy"
            onPress={onPress}
          />
        </>
      )}
    </Page>
  )
}

function LongStringsFixture() {
  const { t } = useTranslation()
  const sentence = t("gallery.stress.action")
  return (
    <Page>
      {(onPress) => (
        <>
          <Sample
            variant="filled"
            label={sentence}
            testID="gallery-button-long-filled"
            onPress={onPress}
          />
          <Sample
            variant="filled"
            label={t("gallery.stress.word")}
            testID="gallery-button-long-word"
            onPress={onPress}
          />
          <Sample
            variant="outlined"
            label={sentence}
            icon={plus}
            testID="gallery-button-long-outlined"
            onPress={onPress}
          />
          <Sample
            variant="text"
            label={sentence}
            testID="gallery-button-long-text"
            onPress={onPress}
          />
        </>
      )}
    </Page>
  )
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.four, paddingVertical: Spacing.four },
  group: { gap: Spacing.two },
})

const meta: GalleryMeta<ButtonProps> = {
  id: "button",
  title: "gallery.button.title",
  component: Button,
  stories: [
    "Filled",
    "Tonal",
    "Outlined",
    "Text",
    "Destructive",
    "Icons",
    "LongStrings",
  ],
}

export default meta

export const Filled: Story = {
  name: "gallery.button.story.filled",
  render: () => <VariantFixture variant="filled" />,
}

export const Tonal: Story = {
  name: "gallery.button.story.tonal",
  render: () => <VariantFixture variant="tonal" />,
}

export const Outlined: Story = {
  name: "gallery.button.story.outlined",
  render: () => <VariantFixture variant="outlined" />,
}

export const Text: Story = {
  name: "gallery.button.story.text",
  render: () => <VariantFixture variant="text" />,
}

export const Destructive: Story = {
  name: "gallery.button.story.destructive",
  render: () => <VariantFixture variant="destructive" />,
}

export const Icons: Story = {
  name: "gallery.button.story.icons",
  render: () => <IconsFixture />,
}

export const LongStrings: Story = {
  name: "gallery.button.story.longStrings",
  render: () => <LongStringsFixture />,
}
