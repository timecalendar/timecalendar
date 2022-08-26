import { AssistantContext } from "modules/assistant/contexts/AssistantContext"
import { AssistantStartParams } from "modules/assistant/types/AssistantStartParams"
import { useRouter } from "next/router"
import React, { FC, useContext, useEffect } from "react"

const AssistantStartPage: FC = () => {
  const router = useRouter()
  const { loadAssistant } = useContext(AssistantContext)
  const query = router.query as AssistantStartParams

  useEffect(() => {
    loadAssistant(query)
  }, [])
  console.log("EFFECT")
  console.log(query)

  return <div>okok</div>
}

export default AssistantStartPage
