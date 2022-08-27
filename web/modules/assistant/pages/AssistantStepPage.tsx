import AssistantStep from "modules/assistant/components/AssistantStep"
import { findAssistant } from "modules/assistant/data/assistants"
import { postNativeMessage } from "modules/shared/helpers/post-native-message"
import { useRouter } from "next/router"
import React, { FC } from "react"

type Query = {
  assistantName: string
  step: string
}

const AssistantStepPage: FC = () => {
  const router = useRouter()
  const query = router.query as Query

  const assistant = findAssistant(query.assistantName)
  if (!assistant || !assistant.steps) return null

  const stepIndex = +query.step

  const onNext = () => {
    if (!assistant.steps) return
    if (stepIndex === assistant.steps.length - 1) {
      postNativeMessage({ name: "assistantEnded" })
      router.push("/assistants/end")
    } else {
      router.push(`/assistants/${assistant.name}/steps/${stepIndex + 1}`)
    }
  }

  const onPrevious = () => {
    router.back()
  }

  return (
    <AssistantStep
      steps={assistant.steps}
      stepIndex={stepIndex}
      onNext={onNext}
      onPrevious={onPrevious}
    />
  )
}

export default AssistantStepPage
