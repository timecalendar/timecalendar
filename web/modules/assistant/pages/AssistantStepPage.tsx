import AssistantStep from "modules/assistant/components/AssistantStep"
import { AssistantStepContent } from "modules/assistant/types/StepContent"
import { useRouter } from "next/router"
import React, { FC } from "react"

type Query = {
  assistantName: string
  step: string
}

const assistants: AssistantStepContent[] = [
  {
    name: "ade",
    steps: [
      {
        title: <>Sélectionnez vos groupes</>,
        description: (
          <>
            <p>
              Sélectionnez les groupes auxquels vous appartenez, ou les cours
              que vous suivez. Vous pouvez en sélectionner plusieurs en
              maintenant la touche Ctrl.
            </p>
            <p>
              Votre emploi du temps devrait s'afficher. Pensez à sélectionner
              tous vos groupes.
            </p>
          </>
        ),
      },
      {
        title: <>Exportez votre emploi du temps</>,
        description: (
          <p>
            Exportez l'emploi du temps en cliquant sur l'icône "Exporter" en bas
            à gauche de la fenêtre.
          </p>
        ),
      },
      {
        title: <>Configurez l'exportation</>,
        description: (
          <>
            <p>
              Dans la fenêtre qui s'ouvre, choisissez les{" "}
              <strong>dates de début et de fin</strong> de votre année
              universitaire.
            </p>
            <p>
              Cliquez ensuite sur <strong>générer l'URL</strong>.
            </p>
          </>
        ),
      },
    ],
  },
]

const AssistantStepPage: FC = () => {
  const router = useRouter()
  const query = router.query as Query

  console.log(query)

  const assistant = assistants.find(
    (assistant) => assistant.name === query.assistantName,
  )
  if (!assistant) return null

  const stepIndex = +query.step

  const onNext = () => {
    if (stepIndex === assistant.steps.length - 1) {
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
