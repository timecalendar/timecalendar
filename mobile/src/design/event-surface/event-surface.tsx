import type { ReactNode } from "react"
import {
  Platform,
  Pressable,
  type StyleProp,
  StyleSheet,
  type TextProps,
  View,
  type ViewStyle,
} from "react-native"

import {
  EventSurfaceContext,
  useEventSurfaceAppearance,
} from "@/design/event-surface/event-surface-context"
import { ThemedText, type ThemedTextType } from "@/design/text/themed-text"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { useIncreasedContrast } from "@/hooks/use-increased-contrast"
import {
  MinTouchTarget,
  Radii,
  resolveEventAppearance,
  Spacing,
  StateOpacity,
  useTheme,
} from "@/theme"

export type EventSurfacePlacement = "flow" | "absolute"

export type EventSurfaceDensity = "regular" | "compact"

export type EventSurfaceLayoutStyle = Pick<
  ViewStyle,
  | "top"
  | "left"
  | "right"
  | "bottom"
  | "width"
  | "height"
  | "flex"
  | "flexGrow"
  | "flexShrink"
  | "alignSelf"
  | "margin"
  | "marginTop"
  | "marginBottom"
  | "marginStart"
  | "marginEnd"
  | "marginLeft"
  | "marginRight"
  | "marginHorizontal"
  | "marginVertical"
>

export type EventSurfaceProps = {
  eventColor: string
  accessibilityLabel: string
  accessibilityHint?: string | undefined
  onPress: () => void
  placement?: EventSurfacePlacement
  density?: EventSurfaceDensity
  testID?: string | undefined
  style?: StyleProp<EventSurfaceLayoutStyle>
  children: ReactNode
}

export const EVENT_STRIPE_WIDTH = 3
const OUTLINE_WIDTH = 2

const DENSITY_PADDING: Record<EventSurfaceDensity, number> = {
  regular: Spacing.three,
  compact: Spacing.two,
}

export function EventSurface({
  eventColor,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  placement = "flow",
  density = "regular",
  testID,
  style,
  children,
}: EventSurfaceProps) {
  const theme = useTheme()
  const scheme = useColorScheme() === "dark" ? "dark" : "light"
  const increasedContrast = useIncreasedContrast()
  const appearance = resolveEventAppearance({
    color: eventColor,
    scheme,
    increasedContrast,
  })
  const ios = Platform.OS === "ios"
  const padding = DENSITY_PADDING[density]

  return (
    <EventSurfaceContext.Provider value={appearance}>
      <Pressable
        testID={testID}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        android_ripple={
          ios ? undefined : { color: theme.ripple, foreground: true }
        }
        style={({ pressed }) =>
          StyleSheet.flatten([
            styles.base,
            placement === "flow" ? styles.flow : styles.absolute,
            {
              backgroundColor: appearance.surface,
              padding,
              paddingStart: padding + EVENT_STRIPE_WIDTH,
            },
            appearance.increasedContrast
              ? { borderWidth: OUTLINE_WIDTH, borderColor: appearance.outline }
              : null,
            ios && pressed ? { opacity: StateOpacity.pressed } : null,
            style,
          ])
        }
      >
        {/* A child, not borderLeftWidth: a leading border on rounded corners tapers into a curved rail. */}
        <View
          testID={testID === undefined ? undefined : `${testID}-stripe`}
          pointerEvents="none"
          style={[styles.stripe, { backgroundColor: appearance.accent }]}
        />
        {children}
      </Pressable>
    </EventSurfaceContext.Provider>
  )
}

export type EventSurfaceTextProps = Omit<
  TextProps,
  | "numberOfLines"
  | "ellipsizeMode"
  | "adjustsFontSizeToFit"
  | "minimumFontScale"
  | "accessible"
> & {
  type?: ThemedTextType
  numberOfLines: number
  ellipsizeMode?: Exclude<TextProps["ellipsizeMode"], "clip">
}

export function EventSurfaceText({ style, ...rest }: EventSurfaceTextProps) {
  const appearance = useEventSurfaceAppearance()
  if (appearance === undefined) {
    throw new Error("EventSurfaceText must be rendered inside an EventSurface")
  }
  return (
    <ThemedText
      {...rest}
      accessible={false}
      style={[style, { color: appearance.foreground }]}
    />
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.medium,
    gap: Spacing.half,
    overflow: "hidden",
  },
  flow: {
    minHeight: MinTouchTarget,
    justifyContent: "center",
  },
  absolute: {
    position: "absolute",
  },
  stripe: {
    position: "absolute",
    start: 0,
    top: 0,
    bottom: 0,
    width: EVENT_STRIPE_WIDTH,
  },
})
