import {
  Children,
  isValidElement,
  type PropsWithChildren,
  type ReactElement,
} from "react"
import { Platform, type StyleProp, StyleSheet, View } from "react-native"

import type { ButtonLayoutStyle } from "@/design/button/button"
import {
  listRowPosition,
  ListRowPositionContext,
} from "@/design/list/list-row-position"
import { joinRowName } from "@/design/list/row-name"
import { ThemedText } from "@/design/text/themed-text"
import { ListGeometry, Spacing } from "@/theme"

export type ListSectionProps = PropsWithChildren<{
  title?: string | undefined
  footer?: string | undefined
  testID?: string | undefined
  style?: StyleProp<ButtonLayoutStyle>
}>

export function ListSection({
  title,
  footer,
  testID,
  style,
  children,
}: ListSectionProps) {
  const rows = Children.toArray(children).filter(
    (child): child is ReactElement => isValidElement(child),
  )
  return (
    <View testID={testID} style={[styles.section, style]}>
      {title ? (
        <ListSectionHeader
          title={title}
          testID={testID ? `${testID}-title` : undefined}
        />
      ) : null}
      <View>
        {rows.map((row, index) => (
          <ListRowPositionContext.Provider
            key={row.key}
            value={listRowPosition(index, rows.length)}
          >
            {row}
          </ListRowPositionContext.Provider>
        ))}
      </View>
      {footer ? (
        <ThemedText
          type="footnote"
          tone="secondary"
          numberOfLines={8}
          style={styles.footer}
          {...(testID ? { testID: `${testID}-footer` } : {})}
        >
          {footer}
        </ThemedText>
      ) : null}
    </View>
  )
}

export type ListSectionHeaderProps = {
  title: string
  detail?: string | undefined
  accessibilityLabel?: string | undefined
  testID?: string | undefined
  style?: StyleProp<ButtonLayoutStyle>
}

export function ListSectionHeader({
  title,
  detail,
  accessibilityLabel,
  testID,
  style,
}: ListSectionHeaderProps) {
  const ios = Platform.OS === "ios"
  const titleType = ios ? "footnote" : "label"
  const titleTone = ios ? "secondary" : "action"
  const inset = ios ? styles.iosTitle : styles.androidTitle
  if (!detail) {
    return (
      <ThemedText
        accessibilityRole="header"
        type={titleType}
        tone={titleTone}
        numberOfLines={4}
        style={[inset, style]}
        {...(testID ? { testID } : {})}
      >
        {title}
      </ThemedText>
    )
  }
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel ?? joinRowName([title, detail])}
      testID={testID}
      style={[inset, style]}
    >
      <ThemedText type={titleType} tone={titleTone} numberOfLines={4}>
        {title}
      </ThemedText>
      <ThemedText type="footnote" tone="secondary" numberOfLines={4}>
        {detail}
      </ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: Spacing.four },
  iosTitle: {
    paddingHorizontal: ListGeometry.rowPaddingHorizontal,
    paddingBottom: Spacing.one + Spacing.half,
  },
  androidTitle: {
    paddingHorizontal: ListGeometry.rowPaddingHorizontal,
    paddingBottom: Spacing.two,
  },
  footer: {
    paddingHorizontal: ListGeometry.rowPaddingHorizontal,
    paddingTop: Spacing.one + Spacing.half,
  },
})
