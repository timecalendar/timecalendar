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

const liveRegion = () => (Platform.OS === "android" ? "polite" : undefined)

type MessageProps = Empty | Failure

function LoadingBody({
  title,
  inline,
  testID,
}: {
  title: string
  inline: boolean
  testID: string | undefined
}) {
  const theme = useTheme()
  const progressID = childID(testID, "progress")
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={title}
      accessibilityState={{ busy: true }}
      accessibilityLiveRegion={liveRegion()}
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
}

function LeadingVisual(props: MessageProps) {
  const theme = useTheme()
  const scheme = useColorScheme() === "dark" ? "dark" : "light"
  const accessibilitySize = useIsAccessibilityTextSize()
  if (props.kind === "error") {
    const glyphID = childID(props.testID, "glyph")
    return (
      <Icon
        {...glyphID}
        ios="exclamationmark.circle"
        android="error_outline"
        size={40}
        color={theme.error}
        scaling="fixed"
      />
    )
  }
  const { symbol, artwork, testID } = props
  const symbolID = childID(testID, "symbol")
  const artworkID = childID(testID, "artwork")
  return (
    <>
      {symbol === undefined ? null : (
        <Icon
          {...symbolID}
          {...symbol}
          size={40}
          color={theme.textSecondary}
          scaling="fixed"
        />
      )}
      {artwork === undefined || accessibilitySize ? null : (
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
    </>
  )
}

function MessageText({
  title,
  caption,
  inline,
  testID,
}: {
  title: string
  caption: string | undefined
  inline: boolean
  testID: string | undefined
}) {
  const textAlign = inline ? undefined : styles.centered
  const textID = childID(testID, "text")
  return (
    // accessibilityLiveRegion does not stop Fabric flattening this View away without a testID.
    <View
      {...textID}
      collapsable={false}
      accessibilityLiveRegion={liveRegion()}
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
  )
}

function MessageActions({
  action,
  secondaryAction,
  inline,
}: {
  action: StatusAction | undefined
  secondaryAction: StatusAction | undefined
  inline: boolean
}) {
  if (!action && !secondaryAction) return null
  return (
    <View style={[styles.actions, inline ? styles.leading : styles.fill]}>
      {action ? <Button variant="filled" {...action} /> : null}
      {secondaryAction ? <Button variant="text" {...secondaryAction} /> : null}
    </View>
  )
}

function MessageBody(props: MessageProps & { inline: boolean }) {
  const { title, caption, inline, testID } = props
  return (
    <>
      <LeadingVisual {...props} />
      <MessageText
        title={title}
        caption={caption}
        inline={inline}
        testID={testID}
      />
      <MessageActions
        action={props.action}
        secondaryAction={props.secondaryAction}
        inline={inline}
      />
    </>
  )
}

function StatusContainer({
  presentation,
  testID,
  style,
  children,
}: {
  presentation: Common["presentation"]
  testID: string | undefined
  style: StyleProp<StatusLayoutStyle> | undefined
  children: ReactNode
}) {
  if (presentation === "screen") {
    return (
      <ScrollView
        testID={testID}
        {...headerScrollProps(false)}
        style={StyleSheet.flatten([styles.screen, style])}
        contentContainerStyle={styles.screenContent}
      >
        {children}
      </ScrollView>
    )
  }
  return (
    <View
      testID={testID}
      style={StyleSheet.flatten([
        presentation === "inline" ? styles.inline : styles.section,
        style,
      ])}
    >
      {children}
    </View>
  )
}

export function StatusView(props: StatusViewProps) {
  const { presentation, title, testID, style } = props
  const inline = presentation === "inline"

  useErrorAnnouncement(
    props.kind !== "loading" && props.caption
      ? `${title}. ${props.caption}`
      : title,
    { key: props.announcementKey ?? props.kind },
  )

  return (
    <StatusContainer presentation={presentation} testID={testID} style={style}>
      {props.kind === "loading" ? (
        <LoadingBody title={title} inline={inline} testID={testID} />
      ) : (
        <MessageBody {...props} inline={inline} />
      )}
    </StatusContainer>
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
