import { Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export function SpikePanel({
  status,
  androidPaging,
  radius,
  onJump,
  onToday,
  onToggleAndroidPaging,
  onToggleContentSize,
}: {
  status: string
  androidPaging: string
  radius: number
  onJump: (pages: number, animated: boolean) => void
  onToday: () => void
  onToggleAndroidPaging: () => void
  onToggleContentSize: () => void
}) {
  return (
    <SafeAreaView edges={["bottom"]} style={styles.panel}>
      <View style={styles.buttons}>
        <SpikeButton label="−20" onPress={() => onJump(-20, false)} />
        <SpikeButton label="‹" onPress={() => onJump(-1, true)} />
        <SpikeButton label="Today" onPress={onToday} />
        <SpikeButton label="›" onPress={() => onJump(1, true)} />
        <SpikeButton label="+20" onPress={() => onJump(20, false)} />
        {Platform.OS === "android" ? (
          <SpikeButton
            label={androidPaging}
            testID="paging-spike-android-mode"
            onPress={onToggleAndroidPaging}
          />
        ) : null}
        <SpikeButton
          label={`K=${radius}`}
          testID="paging-spike-content-size"
          onPress={onToggleContentSize}
        />
      </View>
      <Text testID="paging-spike-status" style={styles.status}>
        {status}
      </Text>
    </SafeAreaView>
  )
}

function SpikeButton({
  label,
  onPress,
  testID,
}: {
  label: string
  onPress: () => void
  testID?: string
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.button}
      {...(testID === undefined ? {} : { testID })}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  panel: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#c7c7cc",
    backgroundColor: "#f2f2f7",
  },
  buttons: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  button: {
    minHeight: 36,
    minWidth: 44,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 15, color: "#e91e63" },
  status: { fontSize: 10, color: "#3a3a3c", marginTop: 4 },
})
