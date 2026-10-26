import { RootPage, StatusView } from "@/design"

interface ImportProgressViewProps {
  message: string
  testID?: string
}

export function ImportProgressView({
  message,
  testID = "calendar-import-progress",
}: ImportProgressViewProps) {
  return (
    <RootPage testID={testID} lane="readable">
      <StatusView kind="loading" presentation="screen" title={message} />
    </RootPage>
  )
}
