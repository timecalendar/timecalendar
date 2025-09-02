const NATIVE_CHANNEL_NAME = "NativeApp"

type NativeMessage =
  | {
      name: "calendarCreated"
      payload: { token: string }
    }
  | { name: "fallbackRequested" }
  | { name: "assistantEnded" }

interface NativeChannel {
  postMessage?: (message: string) => void
}

export const postNativeMessage = (message: NativeMessage) => {
  const nativeChannel = (window as unknown as Record<string, NativeChannel>)[
    NATIVE_CHANNEL_NAME
  ]
  if (!nativeChannel) return
  if (typeof nativeChannel.postMessage === "function") {
    nativeChannel.postMessage(JSON.stringify(message))
  }
}
