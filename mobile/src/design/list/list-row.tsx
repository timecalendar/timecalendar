import { type Href, router } from "expo-router"
import type { SFSymbol } from "expo-symbols"
import { createContext, type ReactElement, useContext } from "react"
import {
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native"

import { useListPalette } from "@/components/chrome"
import type { ButtonLayoutStyle } from "@/design/button/button"
import { Icon, type MaterialGlyph } from "@/design/icon/icon"
import { Separator } from "@/design/list/separator"
import { ThemedText } from "@/design/text/themed-text"
import {
  ChevronMaxFontScale,
  IconSize,
  ListGeometry,
  Spacing,
  StateOpacity,
  useIsAccessibilityTextSize,
  useTheme,
} from "@/theme"

export type ListRowPosition = "first" | "middle" | "last" | "single"

export type ListRowLeading =
  | { icon: { ios: SFSymbol; android: MaterialGlyph } }
  | { element: ReactElement; width: number }

export type ListRowOverline = {
  text: string
  tone: "positive" | "informational" | "destructive"
}

export type ListRowLayoutStyle = ButtonLayoutStyle

type ListRowBase = {
  label: string
  subtitle?: string | undefined
  details?: readonly string[] | undefined
  overline?: ListRowOverline | undefined
  value?: string | undefined
  leading?: ListRowLeading | undefined
  destructive?: boolean | undefined
  accessibilityLabel?: string | undefined
  testID: string
  position?: ListRowPosition | undefined
  style?: StyleProp<ListRowLayoutStyle>
}

type ListRowAction = {
  hint?: string | undefined
  selected?: boolean | undefined
  disabled?: boolean | undefined
  trailing?: "chevron" | undefined
} & ({ onPress: () => void; href?: never } | { href: Href; onPress?: never })

type ListRowStatic = {
  onPress?: never
  href?: never
  hint?: never
  selected?: never
  disabled?: never
  trailing?: ReactElement | undefined
}

export type ListRowProps = ListRowBase & (ListRowAction | ListRowStatic)

export const ListRowPositionContext = createContext<ListRowPosition | null>(
  null,
)

export function listRowPosition(index: number, count: number): ListRowPosition {
  if (count === 1) return "single"
  if (index === 0) return "first"
  return index === count - 1 ? "last" : "middle"
}

const LINES = { label: 8, supporting: 8, value: 4, overline: 2 } as const
const UNBREAKABLE_WORD_MIN_SCALE = 0.5
const GLASS_IOS_MAJOR = 26

function leadingWidth(leading: ListRowLeading | undefined): number | undefined {
  if (!leading) return undefined
  if ("element" in leading) return leading.width
  return Platform.OS === "ios"
    ? ListGeometry.ios.leadingIconTile
    : ListGeometry.android.leadingIcon
}

function groupedShape(position: ListRowPosition): ViewStyle {
  const opensTop = position === "first" || position === "single"
  const closesBottom = position === "last" || position === "single"
  if (Platform.OS === "ios") {
    const glass =
      Number.parseInt(String(Platform.Version), 10) >= GLASS_IOS_MAJOR
    const radius = ListGeometry.ios.groupedRadius[glass ? "glass" : "legacy"]
    return {
      borderTopLeftRadius: opensTop ? radius : 0,
      borderTopRightRadius: opensTop ? radius : 0,
      borderBottomLeftRadius: closesBottom ? radius : 0,
      borderBottomRightRadius: closesBottom ? radius : 0,
      borderCurve: "continuous",
    }
  }
  const { outerRadius, innerRadius, segmentGap } = ListGeometry.android
  return {
    borderTopLeftRadius: opensTop ? outerRadius : innerRadius,
    borderTopRightRadius: opensTop ? outerRadius : innerRadius,
    borderBottomLeftRadius: closesBottom ? outerRadius : innerRadius,
    borderBottomRightRadius: closesBottom ? outerRadius : innerRadius,
    marginBottom: closesBottom ? 0 : segmentGap,
  }
}

function composedRowLabel({
  overline,
  label,
  subtitle,
  details,
}: Pick<ListRowProps, "overline" | "label" | "subtitle" | "details">) {
  return [overline?.text, label, subtitle, ...(details ?? [])]
    .filter(Boolean)
    .join(", ")
}

function LeadingSlot({
  leading,
  width,
  stacked,
}: {
  leading: ListRowLeading
  width: number
  stacked: boolean
}) {
  const theme = useTheme()
  const palette = useListPalette()
  const ios = Platform.OS === "ios"
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.leading,
        { width, alignSelf: stacked ? "flex-start" : "center" },
      ]}
    >
      {"element" in leading ? (
        leading.element
      ) : ios ? (
        <View
          style={[
            styles.iconTile,
            {
              width: ListGeometry.ios.leadingIconTile,
              height: ListGeometry.ios.leadingIconTile,
              backgroundColor: theme.primaryStrong,
            },
          ]}
        >
          <Icon
            ios={leading.icon.ios}
            size={IconSize.medium}
            color={theme.onPrimary}
            scaling="fixed"
          />
        </View>
      ) : (
        <Icon
          android={leading.icon.android}
          size={ListGeometry.android.leadingIcon}
          color={palette.textSecondary}
          scaling="fixed"
        />
      )}
    </View>
  )
}

function SelectedCheck({ testID }: { testID: string }) {
  const theme = useTheme()
  return (
    <Icon
      ios="checkmark"
      android="check"
      size={Platform.OS === "ios" ? IconSize.medium : 24}
      iosWeight="semibold"
      color={theme.primary}
      scaling="text"
      maxFontSizeMultiplier={ChevronMaxFontScale}
      testID={testID}
    />
  )
}

function DisclosureChevron({ testID }: { testID: string }) {
  const theme = useTheme()
  if (Platform.OS !== "ios") return null
  return (
    <Icon
      ios="chevron.forward"
      size={IconSize.small}
      iosWeight="semibold"
      color={theme.textTertiary}
      scaling="text"
      maxFontSizeMultiplier={ChevronMaxFontScale}
      testID={testID}
    />
  )
}

export function ListRow(props: ListRowProps) {
  const theme = useTheme()
  const palette = useListPalette()
  const accessibilitySize = useIsAccessibilityTextSize()
  const contextPosition = useContext(ListRowPositionContext)
  const position = contextPosition ?? props.position
  const grouped = position !== undefined
  const ios = Platform.OS === "ios"
  const geometry = ios ? ListGeometry.ios : ListGeometry.android
  const textColor = grouped ? palette.text : theme.text
  const secondaryColor = grouped ? palette.textSecondary : theme.textSecondary
  const interactive = props.onPress !== undefined || props.href !== undefined
  const disabled = interactive && props.disabled === true
  const selected = interactive && props.selected === true
  const stacked = accessibilitySize && Boolean(props.value || selected)
  const unbreakable = accessibilitySize && !/\s/.test(props.label.trim())
  const leadingBox = leadingWidth(props.leading)
  const name = props.accessibilityLabel ?? composedRowLabel(props)

  const value = props.value ? (
    <ThemedText
      numberOfLines={LINES.value}
      style={[
        styles.value,
        stacked ? null : styles.trailingValue,
        { color: secondaryColor },
      ]}
    >
      {props.value}
    </ThemedText>
  ) : null
  const check = selected ? (
    <SelectedCheck testID={`${props.testID}-check`} />
  ) : null

  const text = (
    <View
      style={styles.text}
      {...(interactive
        ? {}
        : {
            accessible: true,
            accessibilityLabel: name,
            ...(props.value
              ? { accessibilityValue: { text: props.value } }
              : {}),
          })}
    >
      {props.overline ? (
        <ThemedText
          type="label"
          themeColor={props.overline.tone}
          numberOfLines={LINES.overline}
        >
          {props.overline.text}
        </ThemedText>
      ) : null}
      <ThemedText
        {...(unbreakable
          ? {
              numberOfLines: 1,
              adjustsFontSizeToFit: true,
              minimumFontScale: UNBREAKABLE_WORD_MIN_SCALE,
            }
          : { numberOfLines: LINES.label })}
        style={{ color: props.destructive ? theme.destructive : textColor }}
      >
        {props.label}
      </ThemedText>
      {[props.subtitle, ...(props.details ?? [])].map((line, index) =>
        line ? (
          <ThemedText
            key={index}
            type="callout"
            numberOfLines={LINES.supporting}
            style={{ color: secondaryColor }}
          >
            {line}
          </ThemedText>
        ) : null,
      )}
      {stacked ? (
        <View style={styles.stackedTrailing}>
          {value}
          {check}
        </View>
      ) : null}
    </View>
  )

  // A static row's text column already carries the value as its
  // accessibilityValue, so the visible trailing copy is hidden.
  const trailingValue =
    value && !interactive ? (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.value}
      >
        {value}
      </View>
    ) : (
      value
    )

  const content = (
    <>
      {props.leading && leadingBox !== undefined ? (
        <LeadingSlot
          leading={props.leading}
          width={leadingBox}
          stacked={stacked}
        />
      ) : null}
      {text}
      {stacked ? null : trailingValue}
      {stacked ? null : check}
      {interactive && props.trailing === "chevron" ? (
        <DisclosureChevron testID={`${props.testID}-chevron`} />
      ) : null}
      {!interactive && props.trailing ? (
        <View style={styles.accessory}>{props.trailing}</View>
      ) : null}
    </>
  )

  const contentStyle: ViewStyle = {
    minHeight: geometry.rowMinHeight,
    paddingVertical: geometry.rowPaddingVertical,
    paddingHorizontal: ListGeometry.rowPaddingHorizontal,
  }

  const separator =
    ios && (position === "first" || position === "middle") ? (
      <View style={styles.separator}>
        <Separator
          testID={`${props.testID}-separator`}
          inset={
            leadingBox === undefined ? "leading" : { leadingWidth: leadingBox }
          }
        />
      </View>
    ) : null

  return (
    <View
      style={StyleSheet.flatten([
        styles.container,
        grouped ? { backgroundColor: palette.surface } : null,
        position ? groupedShape(position) : null,
        disabled ? { opacity: StateOpacity.disabled } : null,
        props.style,
      ])}
    >
      {interactive ? (
        <Pressable
          testID={props.testID}
          accessibilityRole="button"
          accessibilityLabel={name}
          {...(props.value
            ? { accessibilityValue: { text: props.value } }
            : {})}
          {...(props.hint ? { accessibilityHint: props.hint } : {})}
          accessibilityState={{ selected, disabled }}
          disabled={disabled}
          onPress={() => {
            if (props.href !== undefined) router.push(props.href)
            else props.onPress?.()
          }}
          android_ripple={
            ios || disabled
              ? undefined
              : { color: theme.ripple, foreground: true }
          }
          style={({ pressed }) =>
            StyleSheet.flatten([
              styles.content,
              contentStyle,
              ios && pressed && !disabled
                ? { backgroundColor: theme.backgroundSelected }
                : null,
            ])
          }
        >
          {content}
        </Pressable>
      ) : (
        <View testID={props.testID} style={[styles.content, contentStyle]}>
          {content}
        </View>
      )}
      {separator}
    </View>
  )
}

export function ListRowSeparator({
  leadingWidth,
  testID,
}: {
  leadingWidth?: number
  testID?: string
}) {
  if (Platform.OS !== "ios") return null
  return (
    <Separator
      inset={leadingWidth === undefined ? "leading" : { leadingWidth }}
      testID={testID}
    />
  )
}

const styles = StyleSheet.create({
  container: { overflow: "hidden" },
  content: { flexDirection: "row", alignItems: "center" },
  leading: { marginEnd: ListGeometry.leadingGap, alignItems: "center" },
  iconTile: {
    borderRadius: 7,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: Spacing.half },
  value: { flexShrink: 1 },
  trailingValue: {
    marginStart: Spacing.two,
    textAlign: "right",
    maxWidth: "45%",
  },
  stackedTrailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  accessory: { marginStart: Spacing.two },
  separator: { position: "absolute", start: 0, end: 0, bottom: 0 },
})
