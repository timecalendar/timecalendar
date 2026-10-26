import { createContext, useContext } from "react"

export const NativeListContext = createContext(false)

// A standalone native dialog mounted inside the list host's Compose tree
// orphans its window on Android: Cancel is dead and it outlives a JS reload.
export function useAssertOutsideNativeList(componentName: string) {
  if (useContext(NativeListContext)) {
    throw new Error(
      `${componentName} must render outside NativeList; place it after </NativeList>.`,
    )
  }
}
