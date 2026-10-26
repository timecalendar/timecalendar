import {
  AlertDialog,
  Badge as MaterialBadge,
  Column,
  FloatingActionButton,
  Host as ComposeHost,
  type HostProps as ComposeHostProps,
  Icon as MaterialIcon,
  LazyColumn,
  ListItem,
  type MaterialColors,
  RadioButton,
  Row,
  Switch as MaterialSwitch,
  Text as MaterialText,
  TextButton,
  useMaterialColors,
} from "@expo/ui/jetpack-compose"
import {
  clickable,
  clip,
  defaultMinSize,
  fillMaxSize,
  fillMaxWidth,
  type ModifierConfig,
  padding,
  selectable,
  selectableGroup,
  Shapes,
  testID,
  toggleable,
} from "@expo/ui/jetpack-compose/modifiers"
import {
  Button as SwiftButton,
  Form,
  Host as SwiftHost,
  HStack,
  Image as SwiftImage,
  LabeledContent,
  Section as SwiftSection,
  Spacer,
  Text as SwiftText,
  Toggle as SwiftToggle,
  VStack,
} from "@expo/ui/swift-ui"
import {
  accessibilityHidden,
  accessibilityHint,
  accessibilityIdentifier,
  accessibilityLabel,
  accessibilityValue,
  background,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  type ModifierConfig as SwiftModifierConfig,
  padding as swiftPadding,
  shapes,
  tint,
} from "@expo/ui/swift-ui/modifiers"
import type { Href } from "expo-router"
import { router } from "expo-router"
import {
  Children,
  createContext,
  isValidElement,
  type PropsWithChildren,
  useContext,
} from "react"
import { Platform, StyleSheet } from "react-native"

import { composeSemantics } from "@/components/chrome/compose-semantics"
import {
  NativeListContext,
  useAssertOutsideNativeList,
} from "@/components/chrome/native-list-context"
import {
  materialSymbolSource,
  type NativeListIcon,
} from "@/components/chrome/native-list-icons"
import {
  type ListRowPosition,
  listRowPosition,
} from "@/design/list/list-row-position"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useErrorAnnouncement } from "@/hooks/use-error-announcement"
import { ListGeometry, useIsAccessibilityTextSize, useTheme } from "@/theme"

export type NativeListRowProps = {
  kind: "navigation" | "action" | "value"
  label: string
  accessibilityLabel?: string | undefined
  testID: string
  icon?: NativeListIcon | undefined
  hint?: string | undefined
  subtitle?: string | undefined
  value?: string | undefined
  destructive?: boolean | undefined
  badge?: string | undefined
  href?: Href | undefined
  onPress?: (() => void) | undefined
}

type NativeListSectionProps = PropsWithChildren<{
  title?: string | undefined
  footer?: string | undefined
  testID?: string | undefined
}>

type NativeListProps = PropsWithChildren<{
  reservesFloatingAction?: boolean | undefined
}>

type NativeListFloatingActionProps = {
  label: string
  icon: NativeListIcon
  testID: string
  onPress: () => void
}

type NativeListChoiceRowProps = {
  label: string
  selected: boolean
  selectedAccessibilityLabel: string
  testID: string
  onSelect: () => void
}

type NativeListSwitchRowProps = {
  label: string
  value: boolean
  testID: string
  icon?: NativeListIcon | undefined
  switchTestID?: string
  onValueChange: (value: boolean) => void
}

type NativeListAlertProps = {
  title: string
  message: string
  testID: string
  messageTestID: string
  action?:
    | {
        label: string
        accessibilityLabel: string
        testID: string
        onPress: () => void
      }
    | undefined
}

type NativeListRadioDialogOption<Value extends string> = {
  label: string
  value: Value
}

type NativeListRadioDialogProps<Value extends string> = {
  visible: boolean
  title: string
  cancelLabel: string
  value: Value
  options: readonly NativeListRadioDialogOption<Value>[]
  testID: string
  onSelect: (value: Value) => void
  onDismiss: () => void
}

type Segment = { position: ListRowPosition; titled: boolean }

const SegmentContext = createContext<Segment>({
  position: "single",
  titled: true,
})

const LIST_BOTTOM_PADDING = 24
const FAB_CLEARANCE = 88
const UNBREAKABLE_WORD_MIN_SCALE = 0.5

const segmentCorners: Record<ListRowPosition, { top: number; bottom: number }> =
  {
    first: {
      top: ListGeometry.android.outerRadius,
      bottom: ListGeometry.android.innerRadius,
    },
    middle: {
      top: ListGeometry.android.innerRadius,
      bottom: ListGeometry.android.innerRadius,
    },
    last: {
      top: ListGeometry.android.innerRadius,
      bottom: ListGeometry.android.outerRadius,
    },
    single: {
      top: ListGeometry.android.outerRadius,
      bottom: ListGeometry.android.outerRadius,
    },
  }

function useSegmentModifiers(): ModifierConfig[] {
  const { position, titled } = useContext(SegmentContext)
  const { top, bottom } = segmentCorners[position]
  const leading = position === "first" || position === "single"
  const trailing = position === "last" || position === "single"
  return [
    padding(
      ListGeometry.android.listInset,
      leading && !titled ? ListGeometry.android.listInset : 0,
      ListGeometry.android.listInset,
      trailing ? 0 : ListGeometry.android.segmentGap,
    ),
    clip(
      Shapes.RoundedCorner({
        topStart: top,
        topEnd: top,
        bottomStart: bottom,
        bottomEnd: bottom,
      }),
    ),
  ]
}

function listItemColors(palette: MaterialColors) {
  return {
    containerColor: palette.surfaceContainer,
    contentColor: palette.onSurface,
    leadingContentColor: palette.onSurfaceVariant,
    trailingContentColor: palette.onSurfaceVariant,
    supportingContentColor: palette.onSurfaceVariant,
  }
}

function useResolvedScheme(): "light" | "dark" {
  return useColorScheme() === "dark" ? "dark" : "light"
}

function ComposeListHost({
  children,
  ...props
}: Pick<
  ComposeHostProps,
  "children" | "matchContents" | "style" | "useViewportSizeMeasurement"
>) {
  const colorScheme = useResolvedScheme()
  const theme = useTheme()
  return (
    <ComposeHost {...props} colorScheme={colorScheme} seedColor={theme.primary}>
      {children}
    </ComposeHost>
  )
}

export function NativeList({
  children,
  reservesFloatingAction = false,
}: NativeListProps) {
  const colorScheme = useResolvedScheme()
  const theme = useTheme()
  return (
    <NativeListContext.Provider value>
      {Platform.OS === "ios" ? (
        <SwiftHost
          colorScheme={colorScheme}
          useViewportSizeMeasurement
          style={styles.fill}
        >
          <Form modifiers={[tint(theme.primary)]}>{children}</Form>
        </SwiftHost>
      ) : (
        <ComposeListHost useViewportSizeMeasurement style={styles.fill}>
          <LazyColumn
            contentPadding={{
              top: 0,
              bottom: reservesFloatingAction
                ? LIST_BOTTOM_PADDING + FAB_CLEARANCE
                : LIST_BOTTOM_PADDING,
            }}
            modifiers={[fillMaxSize()]}
          >
            {children}
          </LazyColumn>
        </ComposeListHost>
      )}
    </NativeListContext.Provider>
  )
}

// iOS adds through the navigation bar; only Material pages carry a FAB.
export function NativeListFloatingAction({
  label,
  icon,
  testID: fabTestID,
  onPress,
}: NativeListFloatingActionProps) {
  if (Platform.OS === "ios") return null
  return (
    <ComposeListHost matchContents style={styles.floatingAction}>
      <FloatingActionButton onClick={onPress} modifiers={[testID(fabTestID)]}>
        <FloatingActionButton.Icon>
          <MaterialIcon
            source={materialSymbolSource(icon.android)}
            contentDescription={label}
            size={24}
          />
        </FloatingActionButton.Icon>
      </FloatingActionButton>
    </ComposeListHost>
  )
}

export function NativeListSection(props: NativeListSectionProps) {
  if (Platform.OS === "ios") {
    return <SwiftListSection {...props} />
  }
  return <ComposeListSection {...props} />
}

// SwiftUI applies a Section's accessibilityIdentifier to every row inside it,
// replacing the rows' own identifiers, so iOS sections carry none.
function SwiftListSection({ title, footer, children }: NativeListSectionProps) {
  return (
    <SwiftSection
      {...(title ? { title } : {})}
      {...(footer ? { footer: <SwiftText>{footer}</SwiftText> } : {})}
    >
      {children}
    </SwiftSection>
  )
}

function ComposeListSection({
  title,
  footer,
  testID: sectionTestID,
  children,
}: NativeListSectionProps) {
  const palette = useMaterialColors()
  const items = Children.toArray(children)
  const titled = Boolean(title)
  return (
    <>
      {title ? (
        <MaterialText
          color={palette.primary}
          style={{ typography: "titleSmall" }}
          modifiers={[
            padding(
              ListGeometry.android.listInset,
              24,
              ListGeometry.android.listInset,
              8,
            ),
            ...(sectionTestID ? [testID(sectionTestID)] : []),
          ]}
        >
          {title}
        </MaterialText>
      ) : null}
      {items.map((child, index) => (
        <SegmentContext.Provider
          key={isValidElement(child) && child.key !== null ? child.key : index}
          value={{ position: listRowPosition(index, items.length), titled }}
        >
          {child}
        </SegmentContext.Provider>
      ))}
      {footer ? (
        <MaterialText
          color={palette.onSurfaceVariant}
          style={{ typography: "bodySmall" }}
          modifiers={[
            padding(
              ListGeometry.android.listInset,
              8,
              ListGeometry.android.listInset,
              0,
            ),
          ]}
        >
          {footer}
        </MaterialText>
      ) : null}
    </>
  )
}

export function NativeListAlert(props: NativeListAlertProps) {
  useErrorAnnouncement(`${props.title}. ${props.message}`, { native: true })
  if (Platform.OS === "ios") return <SwiftListAlert {...props} />
  return <ComposeListAlert {...props} />
}

function SwiftListAlert({
  title,
  message,
  messageTestID,
  action,
}: NativeListAlertProps) {
  const theme = useTheme()
  return (
    <SwiftSection>
      <HStack alignment="firstTextBaseline" spacing={12}>
        <SwiftImage
          systemName="exclamationmark.triangle.fill"
          modifiers={[
            font({ textStyle: "body" }),
            foregroundStyle(theme.error),
            accessibilityHidden(),
          ]}
        />
        <VStack alignment="leading" spacing={4}>
          <SwiftText
            modifiers={[
              font({ textStyle: "headline" }),
              foregroundStyle(theme.text),
            ]}
          >
            {title}
          </SwiftText>
          <SwiftText
            modifiers={[
              accessibilityIdentifier(messageTestID),
              font({ textStyle: "subheadline" }),
              foregroundStyle(theme.textSecondary),
            ]}
          >
            {message}
          </SwiftText>
        </VStack>
        <Spacer />
      </HStack>
      {action ? (
        <SwiftButton
          label={action.label}
          onPress={action.onPress}
          modifiers={[
            accessibilityIdentifier(action.testID),
            accessibilityLabel(action.accessibilityLabel),
          ]}
        />
      ) : null}
    </SwiftSection>
  )
}

function ComposeListAlert({
  title,
  message,
  testID: alertTestID,
  messageTestID,
  action,
}: NativeListAlertProps) {
  const palette = useMaterialColors()
  return (
    <ListItem
      colors={{
        containerColor: palette.errorContainer,
        contentColor: palette.onErrorContainer,
        supportingContentColor: palette.onErrorContainer,
        trailingContentColor: palette.onErrorContainer,
      }}
      modifiers={[
        padding(
          ListGeometry.android.listInset,
          ListGeometry.android.listInset,
          ListGeometry.android.listInset,
          0,
        ),
        clip(Shapes.RoundedCorner(ListGeometry.android.outerRadius)),
        testID(alertTestID),
      ]}
    >
      <ListItem.HeadlineContent>
        <MaterialText
          color={palette.onErrorContainer}
          style={{ typography: "titleMedium" }}
        >
          {title}
        </MaterialText>
      </ListItem.HeadlineContent>
      <ListItem.SupportingContent>
        <MaterialText
          color={palette.onErrorContainer}
          style={{ typography: "bodyMedium" }}
          modifiers={[testID(messageTestID)]}
        >
          {message}
        </MaterialText>
      </ListItem.SupportingContent>
      {action ? (
        <ListItem.TrailingContent>
          <TextButton
            onClick={action.onPress}
            modifiers={[testID(action.testID)]}
          >
            <MaterialText>{action.label}</MaterialText>
          </TextButton>
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  )
}

function activateRow(props: NativeListRowProps) {
  if (props.kind === "navigation" && props.href) {
    router.push(props.href)
  } else if (props.kind === "action") {
    props.onPress?.()
  }
}

function SwiftIconTile({ icon }: { icon: NativeListIcon }) {
  const theme = useTheme()
  return (
    <SwiftImage
      systemName={icon.ios}
      size={17}
      color={theme.onPrimary}
      modifiers={[
        frame({ width: 29, height: 29 }),
        background(
          theme.primaryStrong,
          shapes.roundedRectangle({
            cornerRadius: 7,
            roundedCornerStyle: "continuous",
          }),
        ),
        accessibilityHidden(),
      ]}
    />
  )
}

// SwiftUI breaks a word wider than its line mid-word, so at accessibility sizes
// a single-word label stays on one line and shrinks to fit instead.
function useUnbreakableWordModifiers(label: string): SwiftModifierConfig[] {
  const accessibilitySize = useIsAccessibilityTextSize()
  if (!accessibilitySize || /\s/.test(label.trim())) return []
  return [lineLimit(1), minimumScaleFactor(UNBREAKABLE_WORD_MIN_SCALE)]
}

function SwiftRowLabel({
  label,
  icon,
  subtitle,
  destructive = false,
  titleModifiers = [],
  detail,
}: {
  label: string
  icon?: NativeListIcon | undefined
  subtitle?: string | undefined
  destructive?: boolean | undefined
  titleModifiers?: SwiftModifierConfig[] | undefined
  detail?: React.ReactNode
}) {
  const theme = useTheme()
  const wordModifiers = useUnbreakableWordModifiers(label)
  const title = (
    <SwiftText
      modifiers={[
        foregroundStyle(destructive ? theme.error : theme.text),
        ...wordModifiers,
        ...titleModifiers,
      ]}
    >
      {label}
    </SwiftText>
  )
  const text =
    subtitle || detail ? (
      <VStack alignment="leading" spacing={2}>
        {title}
        {subtitle ? (
          <SwiftText
            modifiers={[
              font({ textStyle: "subheadline" }),
              foregroundStyle(theme.textSecondary),
            ]}
          >
            {subtitle}
          </SwiftText>
        ) : null}
        {detail}
      </VStack>
    ) : (
      title
    )
  if (!icon) return text
  return (
    <HStack spacing={12}>
      <SwiftIconTile icon={icon} />
      {text}
    </HStack>
  )
}

function SwiftBadge({ children }: { children: string }) {
  return (
    <SwiftText
      modifiers={[
        font({ textStyle: "subheadline" }),
        foregroundStyle("white"),
        swiftPadding({ horizontal: 7, vertical: 2 }),
        background("red", shapes.capsule()),
      ]}
    >
      {children}
    </SwiftText>
  )
}

type SwiftRowContentProps = Pick<
  NativeListRowProps,
  "label" | "icon" | "subtitle" | "value" | "badge" | "destructive"
>

function SwiftDisclosureChevron() {
  const theme = useTheme()
  return (
    <SwiftImage
      systemName="chevron.forward"
      modifiers={[
        font({ textStyle: "footnote", weight: "semibold" }),
        foregroundStyle(theme.textTertiary),
        accessibilityHidden(),
      ]}
    />
  )
}

function SwiftRowValue({
  value,
  badge,
  hidden = false,
}: Pick<SwiftRowContentProps, "value" | "badge"> & { hidden?: boolean }) {
  const theme = useTheme()
  return (
    <>
      {value ? (
        <SwiftText
          modifiers={[
            foregroundStyle(theme.textSecondary),
            ...(hidden ? [accessibilityHidden()] : []),
          ]}
        >
          {value}
        </SwiftText>
      ) : null}
      {badge ? <SwiftBadge>{badge}</SwiftBadge> : null}
    </>
  )
}

function SwiftDisclosureRowContent({
  label,
  icon,
  subtitle,
  value,
  badge,
}: SwiftRowContentProps) {
  return (
    <HStack spacing={12}>
      <SwiftRowLabel label={label} icon={icon} subtitle={subtitle} />
      <Spacer />
      <HStack spacing={6}>
        <SwiftRowValue value={value} badge={badge} />
        <SwiftDisclosureChevron />
      </HStack>
    </HStack>
  )
}

// At accessibility sizes a side-by-side label and value split the row width and
// SwiftUI hyphenates the label, so the value moves under it.
function SwiftStackedRowLabel({
  label,
  icon,
  subtitle,
  value,
  badge,
  destructive,
  titleModifiers,
  valueHidden = false,
}: SwiftRowContentProps & {
  titleModifiers?: SwiftModifierConfig[] | undefined
  valueHidden?: boolean
}) {
  return (
    <SwiftRowLabel
      label={label}
      icon={icon}
      subtitle={subtitle}
      destructive={destructive}
      titleModifiers={titleModifiers}
      detail={
        <HStack spacing={6}>
          <SwiftRowValue value={value} badge={badge} hidden={valueHidden} />
        </HStack>
      }
    />
  )
}

function SwiftStackedRowContent({
  disclosure,
  ...content
}: SwiftRowContentProps & { disclosure: boolean }) {
  return (
    <HStack spacing={12}>
      <SwiftStackedRowLabel {...content} />
      <Spacer />
      {disclosure ? <SwiftDisclosureChevron /> : null}
    </HStack>
  )
}

function SwiftActionRowContent({
  label,
  icon,
  subtitle,
  value,
  badge,
  destructive,
}: SwiftRowContentProps) {
  return (
    <HStack spacing={12}>
      <SwiftRowLabel
        label={label}
        icon={icon}
        subtitle={subtitle}
        destructive={destructive}
      />
      <Spacer />
      <SwiftRowValue value={value} badge={badge} />
    </HStack>
  )
}

export function NativeListRow(props: NativeListRowProps) {
  if (Platform.OS === "ios") return <SwiftListRow {...props} />
  return <ComposeListRow {...props} />
}

function defaultAccessibilityLabel({
  label,
  subtitle,
}: Pick<NativeListRowProps, "label" | "subtitle">) {
  return subtitle ? `${label}, ${subtitle}` : label
}

function SwiftListRow(props: NativeListRowProps) {
  const stacked = useIsAccessibilityTextSize() && Boolean(props.value)
  const modifiers = [
    accessibilityIdentifier(props.testID),
    accessibilityLabel(
      props.accessibilityLabel ?? defaultAccessibilityLabel(props),
    ),
    ...(props.hint ? [accessibilityHint(props.hint)] : []),
    ...(props.value ? [accessibilityValue(props.value)] : []),
  ]
  const content = {
    label: props.label,
    icon: props.icon,
    subtitle: props.subtitle,
    value: props.value,
    badge: props.badge,
    destructive: props.destructive,
  }
  if (props.kind === "value" && stacked) {
    // LabeledContent gives its label under half the row, so the stacked value
    // row is plain text: the title carries the row's accessibility and the
    // visible value is hidden, so VoiceOver reads the label and value once.
    return (
      <SwiftStackedRowLabel
        {...content}
        titleModifiers={modifiers}
        valueHidden
      />
    )
  }
  if (props.kind === "value") {
    return (
      <LabeledContent
        label={
          props.icon ? (
            <SwiftRowLabel label={props.label} icon={props.icon} />
          ) : (
            props.label
          )
        }
        modifiers={modifiers}
      >
        <SwiftText>{props.value}</SwiftText>
      </LabeledContent>
    )
  }
  const Content =
    props.kind === "navigation"
      ? SwiftDisclosureRowContent
      : SwiftActionRowContent
  return (
    <SwiftButton onPress={() => activateRow(props)} modifiers={modifiers}>
      {stacked ? (
        <SwiftStackedRowContent
          {...content}
          disclosure={props.kind === "navigation"}
        />
      ) : (
        <Content {...content} />
      )}
    </SwiftButton>
  )
}

function ComposeLeadingIcon({ icon }: { icon: NativeListIcon }) {
  const palette = useMaterialColors()
  return (
    <ListItem.LeadingContent>
      <MaterialIcon
        source={materialSymbolSource(icon.android)}
        tint={palette.onSurfaceVariant}
        size={24}
      />
    </ListItem.LeadingContent>
  )
}

function ComposeListRow(props: NativeListRowProps) {
  const palette = useMaterialColors()
  const segment = useSegmentModifiers()
  const interactive = props.kind !== "value"
  const supporting = props.subtitle ?? props.value
  const trailingValue = props.subtitle ? props.value : undefined
  const contentDescription = [
    props.accessibilityLabel ?? defaultAccessibilityLabel(props),
    props.value,
    props.hint,
  ]
    .filter(Boolean)
    .join(", ")
  return (
    <ListItem
      colors={listItemColors(palette)}
      modifiers={[
        ...segment,
        testID(props.testID),
        ...(interactive ? [clickable(() => activateRow(props))] : []),
        // Last, so it clears ListItem's own text while the outer test tag and
        // click action survive.
        composeSemantics({
          contentDescription,
          ...(interactive ? { role: "button" as const } : {}),
        }),
      ]}
    >
      {props.icon ? <ComposeLeadingIcon icon={props.icon} /> : null}
      <ListItem.HeadlineContent>
        <MaterialText
          color={props.destructive ? palette.error : palette.onSurface}
          style={{ typography: "bodyLarge" }}
        >
          {props.label}
        </MaterialText>
      </ListItem.HeadlineContent>
      {supporting ? (
        <ListItem.SupportingContent>
          <MaterialText
            color={palette.onSurfaceVariant}
            style={{ typography: "bodyMedium" }}
          >
            {supporting}
          </MaterialText>
        </ListItem.SupportingContent>
      ) : null}
      {trailingValue || props.badge ? (
        <ListItem.TrailingContent>
          <Row
            horizontalArrangement={{ spacedBy: 8 }}
            verticalAlignment="center"
          >
            {trailingValue ? (
              <MaterialText
                color={palette.onSurfaceVariant}
                style={{ typography: "labelLarge" }}
              >
                {trailingValue}
              </MaterialText>
            ) : null}
            {props.badge ? (
              <MaterialBadge>
                <MaterialText>{props.badge}</MaterialText>
              </MaterialBadge>
            ) : null}
          </Row>
        </ListItem.TrailingContent>
      ) : null}
    </ListItem>
  )
}

export function NativeListSwitchRow(props: NativeListSwitchRowProps) {
  if (Platform.OS === "ios") {
    const { label, icon, value, testID: rowTestID, switchTestID } = props
    return (
      <SwiftToggle
        label={label}
        isOn={value}
        onIsOnChange={props.onValueChange}
        modifiers={[
          accessibilityIdentifier(switchTestID ?? rowTestID),
          accessibilityLabel(label),
        ]}
      >
        {icon ? <SwiftRowLabel label={label} icon={icon} /> : undefined}
      </SwiftToggle>
    )
  }
  return <ComposeListSwitchRow {...props} />
}

function ComposeListSwitchRow({
  label,
  icon,
  value,
  testID: rowTestID,
  switchTestID,
  onValueChange,
}: NativeListSwitchRowProps) {
  const palette = useMaterialColors()
  const segment = useSegmentModifiers()
  const toggle = () => onValueChange(!value)
  return (
    <ListItem
      colors={listItemColors(palette)}
      modifiers={[
        ...segment,
        testID(rowTestID),
        toggleable(value, toggle, { role: "switch" }),
      ]}
    >
      {icon ? <ComposeLeadingIcon icon={icon} /> : null}
      <ListItem.HeadlineContent>
        <MaterialText
          color={palette.onSurface}
          style={{ typography: "bodyLarge" }}
        >
          {label}
        </MaterialText>
      </ListItem.HeadlineContent>
      <ListItem.TrailingContent>
        <MaterialSwitch
          value={value}
          onCheckedChange={onValueChange}
          {...(switchTestID ? { modifiers: [testID(switchTestID)] } : {})}
        />
      </ListItem.TrailingContent>
    </ListItem>
  )
}

export function NativeListChoiceRow(props: NativeListChoiceRowProps) {
  if (Platform.OS === "ios") return <SwiftListChoiceRow {...props} />
  return <ComposeListChoiceRow {...props} />
}

function SwiftListChoiceRow({
  label,
  selected,
  selectedAccessibilityLabel,
  testID: rowTestID,
  onSelect,
}: NativeListChoiceRowProps) {
  const theme = useTheme()
  return (
    <SwiftButton
      onPress={onSelect}
      modifiers={[
        accessibilityIdentifier(rowTestID),
        accessibilityLabel(label),
        accessibilityValue(selected ? selectedAccessibilityLabel : ""),
      ]}
    >
      <HStack>
        <SwiftRowLabel label={label} />
        <Spacer />
        {selected ? (
          <SwiftImage
            systemName="checkmark"
            modifiers={[
              font({ textStyle: "subheadline", weight: "semibold" }),
              foregroundStyle(theme.primary),
              accessibilityHidden(),
            ]}
          />
        ) : null}
      </HStack>
    </SwiftButton>
  )
}

function ComposeListChoiceRow({
  label,
  selected,
  testID: rowTestID,
  onSelect,
}: NativeListChoiceRowProps) {
  const palette = useMaterialColors()
  const segment = useSegmentModifiers()
  return (
    <ListItem
      colors={listItemColors(palette)}
      modifiers={[
        ...segment,
        testID(rowTestID),
        selectable(selected, onSelect, "radioButton"),
      ]}
    >
      <ListItem.HeadlineContent>
        <MaterialText
          color={palette.onSurface}
          style={{ typography: "bodyLarge" }}
        >
          {label}
        </MaterialText>
      </ListItem.HeadlineContent>
      <ListItem.TrailingContent>
        <RadioButton selected={selected} />
      </ListItem.TrailingContent>
    </ListItem>
  )
}

export function NativeListRadioDialog<Value extends string>(
  props: NativeListRadioDialogProps<Value>,
) {
  useAssertOutsideNativeList("NativeListRadioDialog")
  if (!props.visible || Platform.OS === "ios") return null
  return (
    <ComposeListHost matchContents>
      <ComposeRadioDialog {...props} />
    </ComposeListHost>
  )
}

function ComposeRadioDialog<Value extends string>({
  title,
  cancelLabel,
  value,
  options,
  testID: dialogTestID,
  onSelect,
  onDismiss,
}: NativeListRadioDialogProps<Value>) {
  const palette = useMaterialColors()
  return (
    <AlertDialog
      modifiers={[testID(dialogTestID)]}
      onDismissRequest={onDismiss}
    >
      <AlertDialog.Title>
        <MaterialText>{title}</MaterialText>
      </AlertDialog.Title>
      <AlertDialog.Text>
        <Column modifiers={[selectableGroup()]}>
          {options.map((option) => (
            <Row
              key={option.value}
              verticalAlignment="center"
              modifiers={[
                fillMaxWidth(),
                defaultMinSize({ minHeight: 56 }),
                selectable(
                  option.value === value,
                  () => onSelect(option.value),
                  "radioButton",
                ),
                testID(`${dialogTestID}-${option.value}`),
              ]}
            >
              <RadioButton selected={option.value === value} />
              <MaterialText
                color={palette.onSurface}
                style={{ typography: "bodyLarge" }}
                modifiers={[padding(16, 0, 0, 0)]}
              >
                {option.label}
              </MaterialText>
            </Row>
          ))}
        </Column>
      </AlertDialog.Text>
      <AlertDialog.DismissButton>
        <TextButton
          onClick={onDismiss}
          modifiers={[testID(`${dialogTestID}-cancel`)]}
        >
          <MaterialText>{cancelLabel}</MaterialText>
        </TextButton>
      </AlertDialog.DismissButton>
    </AlertDialog>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  floatingAction: { position: "absolute", right: 16, bottom: 16 },
})
