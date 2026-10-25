import { StyleSheet, View } from "react-native"

import type { GalleryEntry } from "./types"

export function GalleryStoryContent({ entry }: { entry: GalleryEntry }) {
  const { story, component: Component } = entry
  const args = story.args ?? {}
  return (
    <View style={styles.fill}>
      {story.render ? story.render(args) : <Component {...args} />}
    </View>
  )
}

const styles = StyleSheet.create({ fill: { flex: 1 } })
