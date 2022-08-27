import { StaticImageData } from "next/image"
import { ReactNode } from "react"

export interface AssistantStepContent {
  name: string
  steps?: StepContent[]
  render?: () => ReactNode
}

export interface StepContent {
  title: ReactNode | string
  description: ReactNode | string
  image?: string | StaticImageData
  legend?: ReactNode | string
}
