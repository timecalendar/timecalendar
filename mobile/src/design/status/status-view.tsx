import { Image } from "expo-image"
import type { SFSymbol } from "expo-symbols"
import type { ReactNode } from "react"
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
} from "react-native"

import {
  Button,
  type ButtonLayoutStyle,
  type ButtonProps,
} from "@/design/button/button"
import { Icon, type MaterialGlyph } from "@/design/icon/icon"
import { headerScrollProps } from "@/design/layout/header-scroll-props"
import { ThemedText } from "@/design/text/themed-text"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useErrorAnnouncement } from "@/hooks/use-error-announcement"
import { Spacing, useIsAccessibilityTextSize, useTheme } from "@/theme"

import type { StatusArtwork } from "./status-artwork"

export type { StatusArtwork }

export type StatusAction = Pick<
  ButtonProps,
  | "label"
  | "onPress"
  | "accessibilityLabel"
  | "accessibilityHint"
  | "accessibilityRole"
  | "testID"
  | "disabled"
  | "busy"
>

export type StatusSymbol = { ios: SFSymbol; android: MaterialGlyph }

export type StatusLayoutStyle = ButtonLayoutStyle

type Common = {
  /**
   * `screen` fills its parent and scrolls once taller than it: the only content
   * of a page, never inside a list or scroll view. `section` is a centered block
   * for a list's empty slot or a page that already scrolls. `inline` is
   * leading-aligned and content-sized, inside a content section.
   */
  presentation: "screen" | "section" | "inline"
  title: string
  /** Re-announces when it changes; text changes under one key stay silent. */
  announcementKey?: string
  testID?: string
  style?: StyleProp<StatusLayoutStyle>
}

type Loading = Common & {
  kind: "loading"
  caption?: never
  action?: never
  secondaryAction?: never
  artwork?: never
  symbol?: never
}

type Actions = {
  caption?: string
  action?: StatusAction
  secondaryAction?: StatusAction
}

type Empty = Common &
  Actions & { kind: "empty" } & (
    | { artwork?: StatusArtwork; symbol?: never }
    | { symbol?: StatusSymbol; artwork?: never }
  )

type Failure = Common &
  Actions & { kind: "error"; artwork?: never; symbol?: never }

export type StatusViewProps = Loading | Empty | Failure

const childID = (testID: string | undefined, suffix: string) =>
  testID === undefined ? {} : { testID: `${testID}-${suffix}` }

export function StatusView(props: StatusViewProps) {
  const { kind, presentation, title, caption, testID, style } = props
  const theme = useTheme()
  const scheme = useColorScheme() === "dark" ? "dark" : "light"
  const accessibilitySize = useIsAccessibilityTextSize()
  const inline = presentation === "inline"
  const progressID = childID(testID, "progress")
  const liveRegion = Platform.OS === "android" ? "polite" : undefined

  useErrorAnnouncement(
    kind !== "loading" && caption ? `${title}. ${caption}` : title,
    { key: props.announcementKey ?? kind },
  )

  let body: ReactNode
  if (kind === "loading") {
    body = (
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={title}
        accessibilityState={{ busy: true }}
        accessibilityLiveRegion={liveRegion}
        style={inline ? styles.loadingRow : styles.loadingColumn}
      >
        <View
          {...progressID}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <ActivityIndicator
            size={inline ? "small" : "large"}
            color={theme.textSecondary}
          />
        </View>
        <ThemedText
          tone="secondary"
          style={inline ? styles.shrink : styles.centered}
        >
          {title}
        </ThemedText>
      </View>
    )
  } else {
    const artwork =
      kind === "empty" && !accessibilitySize ? props.artwork : undefined
    const symbol = kind === "empty" ? props.symbol : undefined
    const textAlign = inline ? undefined : styles.centered
    const glyphID = childID(testID, "glyph")
    const symbolID = childID(testID, "symbol")
    const artworkID = childID(testID, "artwork")
    const textID = childID(testID, "text")
    body = (
      <>
        {kind === "error" ? (
          <Icon
            {...glyphID}
            ios="exclamationmark.circle"
            android="error_outline"
            size={40}
            color={theme.error}
            scaling="fixed"
          />
        ) : null}
        {symbol === undefined ? null : (
          <Icon
            {...symbolID}
            {...symbol}
            size={40}
            color={theme.textSecondary}
            scaling="fixed"
          />
        )}
        {artwork === undefined ? null : (
          <Image
            {...artworkID}
            source={artwork[scheme]}
            contentFit="contain"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.artwork}
          />
        )}
        {/* accessibilityLiveRegion does not stop Fabric flattening this View away without a testID. */}
        <View
          {...textID}
          collapsable={false}
          accessibilityLiveRegion={liveRegion}
          style={[styles.text, inline ? null : styles.fill]}
        >
          <ThemedText type="sectionTitle" style={textAlign}>
            {title}
          </ThemedText>
          {caption ? (
            <ThemedText tone="secondary" style={textAlign}>
              {caption}
            </ThemedText>
          ) : null}
        </View>
        {props.action || props.secondaryAction ? (
          <View style={[styles.actions, inline ? styles.leading : styles.fill]}>
            {props.action ? (
              <Button variant="filled" {...props.action} />
            ) : null}
            {props.secondaryAction ? (
              <Button variant="text" {...props.secondaryAction} />
            ) : null}
          </View>
        ) : null}
      </>
    )
  }

  if (presentation === "screen") {
    return (
      <ScrollView
        testID={testID}
        {...headerScrollProps(false)}
        style={StyleSheet.flatten([styles.screen, style])}
        contentContainerStyle={styles.screenContent}
      >
        {body}
      </ScrollView>
    )
  }

  return (
    <View
      testID={testID}
      style={StyleSheet.flatten([
        inline ? styles.inline : styles.section,
        style,
      ])}
    >
      {body}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  section: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  inline: { alignItems: "flex-start", gap: Spacing.two },
  loadingColumn: { alignItems: "center", gap: Spacing.three },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  text: { gap: Spacing.two },
  fill: { alignSelf: "stretch" },
  leading: { alignItems: "flex-start" },
  actions: { gap: Spacing.two },
  centered: { textAlign: "center" },
  shrink: { flexShrink: 1 },
  artwork: { width: "100%", maxWidth: 280, height: 200 },
})
