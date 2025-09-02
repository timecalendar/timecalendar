"use client"

import { findAssistant } from "modules/assistant/data/assistants"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

const AssistantPage = () => {
  const router = useRouter()
  const params = useParams()
  const assistantName = params.assistantName as string

  const assistant = findAssistant(assistantName)

  useEffect(() => {
    if (assistant?.steps) {
      router.replace(`/assistants/${assistantName}/steps/0`)
    }
  }, [assistant, assistantName, router])

  if (!assistant) return <>Assistant not found</>
  if (assistant.render) return <>{assistant.render()}</>

  return null
}

export default AssistantPage
