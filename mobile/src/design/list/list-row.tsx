import { type Href, router } from "expo-router"
import type { SFSymbol } from "expo-symbols"
import { type ReactElement, type ReactNode, useContext } from "react"
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
import {
  type ListRowPosition,
  ListRowPositionContext,
} from "@/design/list/list-row-position"
import { joinRowName } from "@/design/list/row-name"
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

function trailingGap(): number {
  return Platform.OS === "ios"
    ? ListGeometry.ios.trailingGap
    : ListGeometry.android.trailingGap
}

function SelectedCheck({ testID }: { testID: string }) {
  const theme = useTheme()
  return (
    <Icon
      ios="checkmark"
      android="check"
      size={
        Platform.OS === "ios"
          ? IconSize.medium
          : ListGeometry.android.leadingIcon
      }
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

type RowModel = {
  interactive: boolean
  disabled: boolean
  selected: boolean
  stacked: boolean
  accessory: ReactElement | null
  name: string
  textColor: string
  secondaryColor: string
  leadingBox: number | undefined
}

function useRowModel(props: ListRowProps, grouped: boolean): RowModel {
  const theme = useTheme()
  const palette = useListPalette()
  const accessibilitySize = useIsAccessibilityTextSize()
  const interactive = props.onPress !== undefined || props.href !== undefined
  const selected = interactive && props.selected === true
  const accessory =
    props.trailing && props.trailing !== "chevron" ? props.trailing : null
  return {
    interactive,
    disabled: interactive && props.disabled === true,
    selected,
    stacked:
      accessibilitySize &&
      (Boolean(props.value) || selected || accessory !== null),
    accessory,
    name:
      props.accessibilityLabel ??
      joinRowName([
        props.overline?.text,
        props.label,
        props.subtitle,
        ...(props.details ?? []),
      ]),
    textColor: grouped ? palette.text : theme.text,
    secondaryColor: grouped ? palette.textSecondary : theme.textSecondary,
    leadingBox: leadingWidth(props.leading),
  }
}

function RowLabel({ row, model }: { row: ListRowProps; model: RowModel }) {
  const theme = useTheme()
  const accessibilitySize = useIsAccessibilityTextSize()
  const unbreakable = accessibilitySize && !/\s/.test(row.label.trim())
  return (
    <ThemedText
      {...(unbreakable
        ? {
            numberOfLines: 1,
            adjustsFontSizeToFit: true,
            minimumFontScale: UNBREAKABLE_WORD_MIN_SCALE,
          }
        : { numberOfLines: LINES.label })}
      style={{ color: row.destructive ? theme.destructive : model.textColor }}
    >
      {row.label}
    </ThemedText>
  )
}

function keyedLines(lines: readonly (string | undefined)[]) {
  const seen = new Map<string, number>()
  return lines.flatMap((line) => {
    if (!line) return []
    const occurrence = (seen.get(line) ?? 0) + 1
    seen.set(line, occurrence)
    return [{ key: `${line}#${occurrence}`, line }]
  })
}

function RowText({
  row,
  model,
  stackedTrailing,
}: {
  row: ListRowProps
  model: RowModel
  stackedTrailing: ReactNode
}) {
  const supporting = keyedLines([row.subtitle, ...(row.details ?? [])])
  const stackedAccessory = model.stacked ? model.accessory : null
  const text = (
    <View
      style={stackedAccessory ? styles.stackedText : styles.text}
      {...(model.interactive
        ? {}
        : {
            accessible: true,
            accessibilityLabel: model.name,
            ...(row.value ? { accessibilityValue: { text: row.value } } : {}),
          })}
    >
      {row.overline ? (
        <ThemedText
          type="label"
          themeColor={row.overline.tone}
          numberOfLines={LINES.overline}
        >
          {row.overline.text}
        </ThemedText>
      ) : null}
      <RowLabel row={row} model={model} />
      {supporting.map(({ key, line }) => (
        <ThemedText
          key={key}
          type="callout"
          numberOfLines={LINES.supporting}
          style={{ color: model.secondaryColor }}
        >
          {line}
        </ThemedText>
      ))}
      {model.stacked && stackedTrailing ? (
        <View style={styles.stackedTrailing}>{stackedTrailing}</View>
      ) : null}
    </View>
  )
  if (!stackedAccessory) return text
  // The accessory sits beside the accessible text element, not inside it,
  // so an interactive accessory stays its own focusable element.
  return (
    <View style={styles.text}>
      {text}
      <View style={styles.stackedAccessory}>{stackedAccessory}</View>
    </View>
  )
}

function TrailingValue({
  interactive,
  spaced,
  children,
}: {
  interactive: boolean
  spaced: boolean
  children: ReactNode
}) {
  const style = [
    styles.trailingValue,
    spaced ? { marginEnd: trailingGap() } : null,
  ]
  if (interactive) return <View style={style}>{children}</View>
  // A static row's text column already carries the value as its
  // accessibilityValue, so the visible trailing copy is hidden.
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={style}
    >
      {children}
    </View>
  )
}

function RowValue({ value, model }: { value: string; model: RowModel }) {
  return (
    <ThemedText
      numberOfLines={LINES.value}
      style={[
        styles.value,
        model.stacked ? null : styles.valueText,
        { color: model.secondaryColor },
      ]}
    >
      {value}
    </ThemedText>
  )
}

function InlineTrailing({
  model,
  value,
  check,
  chevron,
}: {
  model: RowModel
  value: ReactNode
  check: ReactNode
  chevron: boolean
}) {
  return (
    <>
      {value ? (
        <TrailingValue
          interactive={model.interactive}
          spaced={check !== null || chevron}
        >
          {value}
        </TrailingValue>
      ) : null}
      {check}
    </>
  )
}

function RowContent({ row, model }: { row: ListRowProps; model: RowModel }) {
  const value = row.value ? <RowValue value={row.value} model={model} /> : null
  const check = model.selected ? (
    <SelectedCheck testID={`${row.testID}-check`} />
  ) : null
  const chevron = row.trailing === "chevron" && Platform.OS === "ios"
  return (
    <>
      {row.leading && model.leadingBox !== undefined ? (
        <LeadingSlot
          leading={row.leading}
          width={model.leadingBox}
          stacked={model.stacked}
        />
      ) : null}
      <RowText
        row={row}
        model={model}
        stackedTrailing={
          value || check ? (
            <>
              {value}
              {check}
            </>
          ) : null
        }
      />
      {model.stacked ? null : (
        <InlineTrailing
          model={model}
          value={value}
          check={check}
          chevron={chevron}
        />
      )}
      {chevron ? <DisclosureChevron testID={`${row.testID}-chevron`} /> : null}
      {model.accessory && !model.stacked ? (
        <View style={styles.accessory}>{model.accessory}</View>
      ) : null}
    </>
  )
}

function RowSeparator({
  testID,
  position,
  leadingBox,
}: {
  testID: string
  position: ListRowPosition | undefined
  leadingBox: number | undefined
}) {
  if (Platform.OS !== "ios") return null
  if (position !== "first" && position !== "middle") return null
  return (
    <View style={styles.separator}>
      <ListRowSeparator
        testID={`${testID}-separator`}
        leadingWidth={leadingBox}
      />
    </View>
  )
}

function activate(row: ListRowProps) {
  if (row.href !== undefined) router.push(row.href)
  else row.onPress?.()
}

export function ListRow(props: ListRowProps) {
  const theme = useTheme()
  const palette = useListPalette()
  const contextPosition = useContext(ListRowPositionContext)
  const position = contextPosition ?? props.position
  const model = useRowModel(props, position !== undefined)
  const ios = Platform.OS === "ios"
  const geometry = ios ? ListGeometry.ios : ListGeometry.android
  const contentStyle: ViewStyle = {
    minHeight: geometry.rowMinHeight,
    paddingVertical: geometry.rowPaddingVertical,
    paddingHorizontal: ListGeometry.rowPaddingHorizontal,
  }
  const { disabled, selected } = model

  return (
    <View
      style={StyleSheet.flatten([
        styles.container,
        position ? { backgroundColor: palette.surface } : null,
        position ? groupedShape(position) : null,
        props.style,
      ])}
    >
      {model.interactive ? (
        <Pressable
          testID={props.testID}
          accessibilityRole="button"
          accessibilityLabel={model.name}
          {...(props.value
            ? { accessibilityValue: { text: props.value } }
            : {})}
          {...(props.hint ? { accessibilityHint: props.hint } : {})}
          accessibilityState={{ selected, disabled }}
          disabled={disabled}
          onPress={() => activate(props)}
          android_ripple={
            ios || disabled
              ? undefined
              : { color: theme.ripple, foreground: true }
          }
          style={({ pressed }) =>
            StyleSheet.flatten([
              styles.content,
              contentStyle,
              disabled ? { opacity: StateOpacity.disabled } : null,
              ios && pressed && !disabled
                ? { backgroundColor: theme.backgroundSelected }
                : null,
            ])
          }
        >
          <RowContent row={props} model={model} />
        </Pressable>
      ) : (
        <View testID={props.testID} style={[styles.content, contentStyle]}>
          <RowContent row={props} model={model} />
        </View>
      )}
      <RowSeparator
        testID={props.testID}
        position={position}
        leadingBox={model.leadingBox}
      />
    </View>
  )
}

export function ListRowSeparator({
  leadingWidth,
  testID,
}: {
  leadingWidth?: number | undefined
  testID?: string | undefined
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
    borderRadius: ListGeometry.ios.leadingIconTileRadius,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: Spacing.half },
  value: { flexShrink: 1 },
  valueText: { textAlign: "right" },
  trailingValue: { flexShrink: 1, marginStart: Spacing.two, maxWidth: "45%" },
  stackedTrailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  stackedText: { gap: Spacing.half },
  accessory: { marginStart: Spacing.two },
  stackedAccessory: { alignSelf: "flex-start", marginTop: Spacing.one },
  separator: { position: "absolute", start: 0, end: 0, bottom: 0 },
})
