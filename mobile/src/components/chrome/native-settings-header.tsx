import { RNHostView as ComposeRNHostView, Row } from "@expo/ui/jetpack-compose"
import { fillMaxWidth, padding } from "@expo/ui/jetpack-compose/modifiers"
import {
  HStack,
  RNHostView as SwiftRNHostView,
  Section as SwiftSection,
  Spacer,
} from "@expo/ui/swift-ui"
import { listRowBackground, listRowInsets } from "@expo/ui/swift-ui/modifiers"
import {
  Image,
  type ImageSourcePropType,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native"

import { ThemedText } from "@/components/themed-text"
import { Radii, Spacing, useTheme } from "@/theme"

const APP_ICON = require("@/assets/images/icon.png") as ImageSourcePropType

const ICON_SIZE = 88
const MAX_WIDTH = 560
const IOS_ROW_MARGIN = 20
const ANDROID_LIST_INSET = 16

type NativeSettingsHeaderProps = {
  title: string
  tagline: string
  detail?: string | undefined
  caption?: string | undefined
  testID: string
  captionTestID?: string | undefined
}

function HeaderContent({
  title,
  tagline,
  detail,
  caption,
  testID,
  captionTestID,
  width,
}: NativeSettingsHeaderProps & { width: number }) {
  const theme = useTheme()
  return (
    <View testID={testID} style={[styles.content, { width }]}>
      <Image
        source={APP_ICON}
        accessible={false}
        style={[
          styles.icon,
          Platform.OS === "ios" ? styles.iosIcon : styles.androidIcon,
          { borderColor: theme.separator },
        ]}
      />
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText style={styles.tagline}>{tagline}</ThemedText>
      {detail ? (
        <ThemedText themeColor="textSecondary" style={styles.detail}>
          {detail}
        </ThemedText>
      ) : null}
      {caption ? (
        <View style={[styles.pill, { backgroundColor: theme.primarySoft }]}>
          <ThemedText
            testID={captionTestID}
            themeColor="actionText"
            style={styles.caption}
          >
            {caption}
          </ThemedText>
        </View>
      ) : null}
    </View>
  )
}

export function NativeSettingsHeader(props: NativeSettingsHeaderProps) {
  const window = useWindowDimensions()
  if (Platform.OS === "ios") {
    const width = Math.min(window.width - IOS_ROW_MARGIN * 2, MAX_WIDTH)
    return (
      <SwiftSection>
        <HStack
          modifiers={[
            listRowBackground("clear"),
            listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
          ]}
        >
          <Spacer />
          <SwiftRNHostView matchContents>
            <HeaderContent {...props} width={width} />
          </SwiftRNHostView>
          <Spacer />
        </HStack>
      </SwiftSection>
    )
  }
  const width = Math.min(window.width - ANDROID_LIST_INSET * 2, MAX_WIDTH)
  return (
    <Row
      horizontalArrangement="center"
      modifiers={[fillMaxWidth(), padding(0, ANDROID_LIST_INSET, 0, 0)]}
    >
      <ComposeRNHostView matchContents>
        <HeaderContent {...props} width={width} />
      </ComposeRNHostView>
    </Row>
  )
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.two,
  },
  iosIcon: {
    borderRadius: 20,
    borderCurve: "continuous",
  },
  androidIcon: {
    borderRadius: ICON_SIZE / 2,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
    textAlign: "center",
  },
  tagline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: 400,
    textAlign: "center",
  },
  detail: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 400,
    textAlign: "center",
  },
  pill: {
    marginTop: Spacing.one,
    paddingHorizontal: 12,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 600,
    textAlign: "center",
  },
})
