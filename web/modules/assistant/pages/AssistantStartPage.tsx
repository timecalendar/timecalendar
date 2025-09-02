import { AssistantContext } from "modules/assistant/contexts/AssistantContext"
import { AssistantStartParams } from "modules/assistant/types/AssistantStartParams"
import PageCircularProgress from "modules/shared/components/PageCircularProgress"
import useLoading from "modules/shared/hooks/useLoading"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { FC, useContext, useEffect } from "react"

const AssistantStartPage: FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { initAssistant } = useContext(AssistantContext)

  const params: AssistantStartParams = {
    schoolId: searchParams.get("schoolId") || undefined,
    fallback: searchParams.get("fallback") || undefined,
    gradeName: searchParams.get("gradeName") || undefined,
    schoolName: searchParams.get("schoolName") || undefined,
    assistant: searchParams.get("assistant") || undefined,
  }

  const [loading, init] = useLoading(async () => {
    const assistantName = await initAssistant(params)
    router.replace(`/assistants/${assistantName}`)
  })

  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return loading ? <PageCircularProgress /> : null
}

export default AssistantStartPage
