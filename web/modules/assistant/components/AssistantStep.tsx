import AssistantLayout from "modules/assistant/components/AssistantLayout"
import { StepContent } from "modules/assistant/types/StepContent"
import { Button } from "components/ui/button"
import Image from "next/image"

interface Props {
  steps: StepContent[]
  stepIndex: number
  onNext: () => void
  onPrevious: () => void
}

const AssistantStep = ({ steps, stepIndex, onNext, onPrevious }: Props) => {
  const { image, legend, title, description } = steps[stepIndex]

  return (
    <AssistantLayout image={image} legend={legend}>
      <div className="h-screen flex items-center">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">{title}</h2>
          <div className="mb-12">{description}</div>
          <div className="mb-12 block md:hidden">
            {image ? (
              <div>
                <Image src={image} alt="" />
              </div>
            ) : null}
            {legend ? (
              <div className="mt-4 text-center text-gray-800">{legend}</div>
            ) : null}
          </div>
          <div className="flex flex-row gap-4 mb-8 justify-end">
            <Button onClick={onPrevious} variant="outline">
              Retour
            </Button>
            <Button onClick={onNext} variant="default">
              Suivant
            </Button>
          </div>
        </div>
      </div>
    </AssistantLayout>
  )
}

export default AssistantStep
