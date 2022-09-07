import { AssistantStepContent } from "modules/assistant/types/StepContent"
import exportIcal from "modules/assistant/assets/images/celcat/export_ical.png"
import selectGroups from "modules/assistant/assets/images/celcat/select_groups.png"
import selectWeeks from "modules/assistant/assets/images/celcat/select_weeks.png"

const celcatAssistant: AssistantStepContent = {
  name: "celcat",
  steps: [
    {
      title: <>Sélectionnez votre groupe</>,
      description: (
        <>En haut à gauche, sélectionnez votre groupe dans le menu déroulant.</>
      ),
      image: selectGroups,
      legend: <>Sélectionnez votre groupe.</>,
    },
    {
      title: <>Sélectionnez toutes les semaines</>,
      description: (
        <>
          En haut à gauche, sélectionnez <strong>Toutes les semaines</strong>{" "}
          dans le menu déroulant.
        </>
      ),
      image: selectWeeks,
      legend: <>Sélectionnez "Toutes les semaines" dans le menu déroulant.</>,
    },
    {
      title: <>Copiez le lien du calendrier ICS</>,
      image: exportIcal,
      description: (
        <>
          En haut à gauche, faites clic droit sur <strong>ICS</strong>, puis
          cliquez sur <strong>Copier l'adresse du lien</strong> pour copier
          l'adresse de votre calendrier.
        </>
      ),
      legend: (
        <>
          Faites clic droit sur ICS, puis{" "}
          <strong>Copier l'adresse du lien</strong>.
        </>
      ),
    },
  ],
}

export default celcatAssistant
