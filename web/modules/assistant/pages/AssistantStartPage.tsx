import { AssistantContext } from "modules/assistant/contexts/AssistantContext"
import { AssistantStartParams } from "modules/assistant/types/AssistantStartParams"
import PageCircularProgress from "modules/shared/components/PageCircularProgress"
import useLoading from "modules/shared/hooks/useLoading"
import { useRouter } from "next/router"
import { FC, useContext, useEffect } from "react"

const AssistantStartPage: FC = () => {
  const router = useRouter()
  const { initAssistant } = useContext(AssistantContext)
  const params = router.query as AssistantStartParams

  const [loading, init] = useLoading(async () => {
    const assistantName = await initAssistant(params)
    router.replace(`/assistants/${assistantName}`)
  })

  useEffect(() => {
    if (router.isReady) init()
  }, [router.isReady])

  return loading ? <PageCircularProgress /> : null
}

export default AssistantStartPage
