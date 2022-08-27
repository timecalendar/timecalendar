const NATIVE_CHANNEL_NAME = "NativeApp"

type NativeMessage =
  | {
      name: "calendarCreated"
      payload: { token: string }
    }
  | { name: "fallbackRequested" }
  | { name: "assistantEnded" }

export const postNativeMessage = (message: NativeMessage) => {
  const nativeChannel = (window as any)[NATIVE_CHANNEL_NAME]
  if (!nativeChannel) return
  nativeChannel.postMessage(JSON.stringify(message))
}
