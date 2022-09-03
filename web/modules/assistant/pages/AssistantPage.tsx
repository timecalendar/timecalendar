import { findAssistant } from "modules/assistant/data/assistants"
import { useRouter } from "next/router"
import { useEffect } from "react"

type Query = {
  assistantName: string
  step: string
}

const AssistantPage = () => {
  const router = useRouter()
  const query = router.query as Query

  const assistant = findAssistant(query.assistantName)

  useEffect(() => {
    if (assistant?.steps) {
      router.replace(`/assistants/${query.assistantName}/steps/0`)
    }
  }, [assistant])

  if (!assistant) return null
  if (assistant.render) return <>{assistant.render()}</>

  return null
}

export default AssistantPage
