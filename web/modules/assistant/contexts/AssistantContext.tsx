import { SchoolForList, SchoolsApi } from "@timecalendar/api-client"
import { AssistantStartParams } from "modules/assistant/types/AssistantStartParams"
import { createApiInstance } from "modules/shared/utils/create-api-instance"
import React, { createContext, ReactNode, useState } from "react"

type Context = {
  school: SchoolForList | undefined
  loadAssistant: (params: AssistantStartParams) => Promise<void>
}

export const AssistantContext = createContext<Context>({} as Context)

type Props = {
  children: ReactNode
}

export const AssistantContextProvider = ({ children }: Props) => {
  const [school, setSchool] = useState<SchoolForList>()

  const loadAssistant = async ({ schoolId }: AssistantStartParams) => {
    console.log(schoolId)
    if (schoolId) {
      const { data: fetchedSchool } = await createApiInstance(
        SchoolsApi,
      ).findSchool(schoolId)
      setSchool(fetchedSchool)
    }
  }

  return (
    <AssistantContext.Provider
      value={{
        school,
        loadAssistant,
      }}
    >
      {children}
    </AssistantContext.Provider>
  )
}
