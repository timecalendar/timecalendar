import { createContext, useContext } from "react"

export const NativeSettingsHostContext = createContext(false)

// A standalone native dialog mounted inside the settings host's Compose tree
// orphans its window on Android: Cancel is dead and it outlives a JS reload.
export function useAssertOutsideNativeSettingsHost(componentName: string) {
  if (useContext(NativeSettingsHostContext)) {
    throw new Error(
      `${componentName} must render outside NativeSettingsHost; place it after </NativeSettingsHost>.`,
    )
  }
}
