import { Button } from "@mui/material"
import { StepContent } from "modules/assistant/types/StepContent"

interface Props {
  steps: StepContent[]
  stepIndex: number
  onNext: () => void
  onPrevious: () => void
}

const AssistantStep = ({ steps, stepIndex, onNext, onPrevious }: Props) => {
  const currentStep = steps[stepIndex]

  return (
    <div>
      <div>{currentStep.title}</div>
      <div>{currentStep.description}</div>
      <div>
        <Button onClick={onPrevious}>Retour</Button>
        <Button onClick={onNext}>Suivant</Button>
      </div>
    </div>
  )
}

export default AssistantStep
