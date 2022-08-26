import { ReactNode } from "react"

export interface AssistantStepContent {
  name: string
  steps: StepContent[]
}

export interface StepContent {
  title: ReactNode | string
  description: ReactNode | string
  image?: string
  legend?: ReactNode | string
}
