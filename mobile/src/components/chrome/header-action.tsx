import {
  Icon as MaterialIcon,
  IconButton,
  Row,
  Text as MaterialText,
  TextButton,
} from "@expo/ui/jetpack-compose"
import { testID } from "@expo/ui/jetpack-compose/modifiers"
import type {
  NativeStackHeaderItem,
  NativeStackNavigationOptions,
} from "expo-router"
import { Platform } from "react-native"

import { SeededComposeHost } from "@/components/chrome/compose-host"
import { composeSemantics } from "@/components/chrome/compose-semantics"
import {
  materialSymbolSource,
  type NativeIcon,
} from "@/components/chrome/native-icons"
import { joinRowName } from "@/design/list/row-name"
import { useTheme } from "@/theme"

type HeaderActionBase = {
  accessibilityLabel: string
  accessibilityHint?: string | undefined
  testID: string
  onPress: () => void
  disabled?: boolean | undefined
  platform?: "ios" | "android" | undefined
}

export type HeaderAction =
  | (HeaderActionBase & { icon: NativeIcon; label?: never })
  | (HeaderActionBase & { label: string; icon?: never })

export type HeaderActionOptions = Pick<
  NativeStackNavigationOptions,
  | "headerLeft"
  | "headerRight"
  | "unstable_headerLeftItems"
  | "unstable_headerRightItems"
>

type HeaderActionSides = {
  left?: readonly HeaderAction[] | undefined
  right?: readonly HeaderAction[] | undefined
}

// setOptions merges, so a declared side left empty is cleared with an explicit
// undefined (the navigation types omit it, hence `cleared`), while an
// undeclared side stays absent and never overwrites a slot the screen sets.
const cleared = undefined as never

export function useHeaderActions(
  sides: HeaderActionSides,
): HeaderActionOptions {
  const theme = useTheme()
  const declared = (side: keyof HeaderActionSides) => {
    if (!(side in sides)) return null
    return (sides[side] ?? []).filter(onThisPlatform)
  }
  const left = declared("left")
  const right = declared("right")

  if (Platform.OS === "ios") {
    const barItems = (items: HeaderAction[]) =>
      items.length > 0
        ? () => items.map((item) => barButtonItem(item, theme.text))
        : cleared
    return {
      ...(left && { unstable_headerLeftItems: barItems(left) }),
      ...(right && { unstable_headerRightItems: barItems(right) }),
    }
  }

  const bar = (items: HeaderAction[]) =>
    items.length > 0
      ? function HeaderActions() {
          return <HeaderActionBar items={items} contentColor={theme.text} />
        }
      : cleared
  return {
    ...(left && { headerLeft: bar(left) }),
    ...(right && { headerRight: bar(right) }),
  }
}

function onThisPlatform(item: HeaderAction) {
  return item.platform === undefined || item.platform === Platform.OS
}

function barButtonItem(
  item: HeaderAction,
  tintColor: string,
): NativeStackHeaderItem {
  return {
    type: "button",
    label: item.label ?? item.accessibilityLabel,
    ...(item.icon && {
      icon: { type: "sfSymbol" as const, name: item.icon.ios },
    }),
    tintColor,
    accessibilityLabel: item.accessibilityLabel,
    ...(item.accessibilityHint && {
      accessibilityHint: item.accessibilityHint,
    }),
    identifier: item.testID,
    disabled: item.disabled === true,
    onPress: item.onPress,
  }
}

function spokenName(item: HeaderAction) {
  return joinRowName([item.accessibilityLabel, item.accessibilityHint])
}

function HeaderActionBar({
  items,
  contentColor,
}: {
  items: HeaderAction[]
  contentColor: string
}) {
  return (
    <SeededComposeHost matchContents>
      <Row verticalAlignment="center">
        {items.map((item) => {
          const shared = {
            enabled: item.disabled !== true,
            onClick: item.onPress,
            colors: { contentColor },
            modifiers: [testID(item.testID)],
          }
          return item.icon ? (
            <IconButton key={item.testID} {...shared}>
              <MaterialIcon
                source={materialSymbolSource(item.icon.android)}
                contentDescription={spokenName(item)}
                size={24}
              />
            </IconButton>
          ) : (
            <TextButton key={item.testID} {...shared}>
              {/* The description sits on the label: clearAndSetSemantics on
                  the button itself would also clear its click action. */}
              <MaterialText
                maxLines={1}
                overflow="ellipsis"
                style={{ typography: "labelLarge" }}
                modifiers={[
                  composeSemantics({ contentDescription: spokenName(item) }),
                ]}
              >
                {item.label}
              </MaterialText>
            </TextButton>
          )
        })}
      </Row>
    </SeededComposeHost>
  )
}
