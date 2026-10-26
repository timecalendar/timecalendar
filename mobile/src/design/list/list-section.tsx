import {
  Children,
  isValidElement,
  type PropsWithChildren,
  type ReactElement,
} from "react"
import { Platform, type StyleProp, StyleSheet, View } from "react-native"

import type { ButtonLayoutStyle } from "@/design/button/button"
import { listRowPosition, ListRowPositionContext } from "@/design/list/list-row"
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
  const ios = Platform.OS === "ios"
  return (
    <View testID={testID} style={[styles.section, style]}>
      {title ? (
        <ThemedText
          accessibilityRole="header"
          type={ios ? "footnote" : "label"}
          tone={ios ? "secondary" : "action"}
          numberOfLines={4}
          style={ios ? styles.iosTitle : styles.androidTitle}
          {...(testID ? { testID: `${testID}-title` } : {})}
        >
          {title}
        </ThemedText>
      ) : null}
      <View>
        {rows.map((row, index) => (
          <ListRowPositionContext.Provider
            key={row.key ?? index}
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
