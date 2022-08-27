import {
  CalendarsApi,
  SchoolForList,
  SchoolsApi,
} from "@timecalendar/api-client"
import { AssistantStartParams } from "modules/assistant/types/AssistantStartParams"
import { getApiErrorMessage } from "modules/shared/helpers/error-message"
import useLoading from "modules/shared/hooks/useLoading"
import LoadingDialog from "modules/shared/components/LoadingDialog"
import { createApiInstance } from "modules/shared/utils/create-api-instance"
import React, { createContext, ReactNode, useEffect, useState } from "react"
import ErrorDialog from "modules/shared/components/ErrorDialog"
import { useRouter } from "next/router"
import { postNativeMessage } from "modules/shared/helpers/post-native-message"

type Context = {
  school: SchoolForList | undefined
  initAssistant: (params: AssistantStartParams) => Promise<string>
  createCalendar: (url: string) => Promise<void>
}

type ProviderState = {
  school: SchoolForList | undefined
  schoolName: string | undefined
  gradeName: string | undefined
}

export const AssistantContext = createContext<Context>({} as Context)

type Props = {
  children: ReactNode
}

const LOCAL_STORAGE_KEY = "AssistantContextData"

const getInitialState = (): ProviderState => {
  const state = localStorage.getItem(LOCAL_STORAGE_KEY)
  return state
    ? JSON.parse(state)
    : {
        school: undefined,
      }
}

export const AssistantContextProvider = ({ children }: Props) => {
  const router = useRouter()
  const [data, setData] = useState(getInitialState())
  const [error, setError] = useState<string>()

  const initAssistant = async ({
    schoolId,
    fallback,
    gradeName,
    schoolName,
  }: AssistantStartParams) => {
    if (schoolId) {
      const { data: fetchedSchool } = await createApiInstance(
        SchoolsApi,
      ).findSchool(schoolId)
      setData({
        school: fetchedSchool,
        schoolName: undefined,
        gradeName: undefined,
      })

      return fallback && fetchedSchool.fallbackAssistant
        ? fetchedSchool.fallbackAssistant.slug
        : fetchedSchool.assistant.slug
    }

    setData({ school: undefined, schoolName, gradeName })
    return "generic"
  }

  const [loading, createCalendar] = useLoading(async (url: string) => {
    try {
      const { token } = await createApiInstance(CalendarsApi)
        .createCalendar({
          schoolId: data.school ? data.school.id : undefined,
          schoolName: data.schoolName,
          name: data.gradeName || "TimeCalendar",
          url,
          customData: null,
        })
        .then(({ data }) => data)

      postNativeMessage({
        name: "calendarCreated",
        payload: { token },
      })
      router.push(`/assistants/end`)
    } catch (err: any) {
      setError(getApiErrorMessage(err))
    }
  })

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
  }, [data])

  return (
    <AssistantContext.Provider
      value={{
        school: data.school,
        initAssistant,
        createCalendar,
      }}
    >
      {children}
      <LoadingDialog text="Importation en cours..." open={loading} />
      <ErrorDialog
        title="Erreur d'importation"
        text={
          <>
            Aïe, nous n'avons pas réussi à importer votre emploi du temps.
            Vérifiez vos groupes et réessayez. Si le problème persiste, vous
            pouvez essayer d'importer votre calendrier ICal.
          </>
        }
        onClose={() => setError(undefined)}
        open={Boolean(error)}
      />
    </AssistantContext.Provider>
  )
}
