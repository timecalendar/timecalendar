import {
  FloatingActionButton,
  Icon as MaterialIcon,
} from "@expo/ui/jetpack-compose"
import { testID } from "@expo/ui/jetpack-compose/modifiers"
import { Platform, StyleSheet } from "react-native"

import { SeededComposeHost } from "@/components/chrome/compose-host"
import {
  materialSymbolSource,
  type NativeIcon,
} from "@/components/chrome/native-icons"
import { Spacing } from "@/theme"

export type FloatingActionProps = {
  icon: NativeIcon
  label: string
  testID: string
  onPress: () => void
}

// iOS adds through the navigation bar; only Material pages carry a FAB.
export function FloatingAction({
  icon,
  label,
  testID: fabTestID,
  onPress,
}: FloatingActionProps) {
  if (Platform.OS === "ios") return null
  return (
    <SeededComposeHost matchContents style={styles.floatingAction}>
      <FloatingActionButton onClick={onPress} modifiers={[testID(fabTestID)]}>
        <FloatingActionButton.Icon>
          <MaterialIcon
            source={materialSymbolSource(icon.android)}
            contentDescription={label}
            size={24}
          />
        </FloatingActionButton.Icon>
      </FloatingActionButton>
    </SeededComposeHost>
  )
}

const styles = StyleSheet.create({
  floatingAction: {
    position: "absolute",
    right: Spacing.three,
    bottom: Spacing.three,
  },
})
