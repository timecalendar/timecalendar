"use client"

import { AssistantContextProvider } from "@/modules/assistant/contexts/AssistantContext"
import { NoSSR } from "@/modules/shared/components/NoSSR"

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NoSSR>
      <AssistantContextProvider>{children}</AssistantContextProvider>
    </NoSSR>
  )
}
