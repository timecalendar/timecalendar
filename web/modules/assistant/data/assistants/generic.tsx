import { AssistantStepContent } from "modules/assistant/types/StepContent"
import showCalendar from "modules/assistant/assets/images/generic/show_calendar.png"

const genericAssistant: AssistantStepContent = {
  name: "generic",
  steps: [
    {
      title: <>Affichez votre emploi du temps</>,
      description: (
        <>Rendez-vous sur la page de votre emploi du temps pour l'afficher.</>
      ),
      image: showCalendar,
      legend: <>Affichez votre emploi du temps sur votre intranet.</>,
    },
    {
      title: <>Exportez votre emploi du temps</>,
      description: (
        <>
          Exportez l'emploi du temps au format ICal. Si besoin, configurez
          l'exportation pour sélectionner votre période universitaire.
        </>
      ),
    },
    {
      title: <>Copiez l'URL générée</>,
      description: (
        <>Une fois l'URL ICal de votre emploi du temps généré, copiez-le.</>
      ),
    },
  ],
}

export default genericAssistant
