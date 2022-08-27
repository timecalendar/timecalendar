import GroupAssistant from "modules/assistant/components/groups/GroupAssistant"
import { AssistantStepContent } from "modules/assistant/types/StepContent"
import adeSelectGroupsImage from "modules/assistant/assets/images/ade/ade_schema.png"
import adeExportIconImage from "modules/assistant/assets/images/ade/export_icon.png"
import adeExportPopupImage from "modules/assistant/assets/images/ade/export_popup.png"
import adeExportUrlImage from "modules/assistant/assets/images/ade/export_url.png"
import hplanningExportIcon from "modules/assistant/assets/images/hplanning/export_icon.png"
import hplanningExportPopup from "modules/assistant/assets/images/hplanning/export_popup.png"

export const assistants: AssistantStepContent[] = [
  {
    name: "groups",
    render: () => <GroupAssistant />,
  },
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
        image: adeSelectGroupsImage,
        legend: <>Sélectionnez vos groupes dans la partie de gauche.</>,
      },
      {
        title: <>Exportez votre emploi du temps</>,
        description: (
          <p>
            Exportez l'emploi du temps en cliquant sur l'icône "Exporter" en bas
            à gauche de la fenêtre.
          </p>
        ),
        image: adeExportIconImage,
        legend: <>Cliquez sur le calendrier.</>,
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
        image: adeExportPopupImage,
        legend: <>Sélectionnez vos dates de début et de fin.</>,
      },
      {
        title: <>Copiez l'URL générée</>,
        description: (
          <>
            L'URL de votre emploi du temps a été généré. Copiez l'URL qui
            apparaît. Vous pouvez faire clic droit sur l'URL, puis Copier
            l'adresse du lien.
          </>
        ),
        image: adeExportUrlImage,
        legend: <>Copiez l'URL affichée.</>,
      },
    ],
  },
  {
    name: "hplanning",
    steps: [
      {
        title: <>Exportez votre emploi du temps</>,
        description: (
          <>
            <p>
              Consultez votre emploi du temps en allant dans la rubrique
              "Cours".
            </p>
            <p>En haut à droite, cliquez sur l'icône Agenda.</p>
          </>
        ),
        image: hplanningExportIcon,
        legend: <>En haut à droite, cliquez sur le calendrier.</>,
      },
      {
        title: <>Configurez l'exportation</>,
        description: (
          <>
            <p>
              Dans la fenêtre qui s'ouvre, laissez coché{" "}
              <strong>Toutes les semaines publiées</strong>.
            </p>
            <p>Copiez ensuite l'URL qui apparaît dans la zone de texte.</p>
          </>
        ),
        image: hplanningExportPopup,
        legend: (
          <>Sélectionnez "Toutes les semaines publiées" et copiez l'URL.</>
        ),
      },
    ],
  },
]

export const findAssistant = (asisstantName: string) =>
  assistants.find((assistant) => assistant.name === asisstantName)
