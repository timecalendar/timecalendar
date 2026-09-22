import { Text as MaterialText } from "@expo/ui/jetpack-compose"
import { testID as composeTestID } from "@expo/ui/jetpack-compose/modifiers"
import { Text as SwiftText } from "@expo/ui/swift-ui"
import {
  accessibilityIdentifier,
  font,
  foregroundStyle,
} from "@expo/ui/swift-ui/modifiers"
import { Platform } from "react-native"

import { useErrorAnnouncement } from "@/components/use-error-announcement"
import { useTheme } from "@/theme"

// Content-only adapter: callers retain their existing native host and layout.
// Both branches contain native widgets, never RN children inside a native tree.
export function NativeErrorNotice({
  title,
  message,
  testID,
}: {
  title?: string
  message: string
  testID: string
}) {
  const theme = useTheme()
  useErrorAnnouncement(title ? `${title}. ${message}` : message, {
    native: true,
  })
  if (Platform.OS === "ios") {
    return (
      <>
        {title ? (
          <SwiftText modifiers={[font({ textStyle: "headline" })]}>
            {title}
          </SwiftText>
        ) : null}
        <SwiftText
          modifiers={[
            accessibilityIdentifier(testID),
            font({ textStyle: "subheadline" }),
            foregroundStyle(theme.error),
          ]}
        >
          {message}
        </SwiftText>
      </>
    )
  }
  return (
    <>
      {title ? (
        <MaterialText style={{ typography: "titleSmall" }}>
          {title}
        </MaterialText>
      ) : null}
      <MaterialText
        modifiers={[composeTestID(testID)]}
        color={theme.error}
        style={{ typography: "bodyMedium" }}
      >
        {message}
      </MaterialText>
    </>
  )
}
