import hplanningExportIcon from "modules/assistant/assets/images/hplanning/export_icon.png"
import hplanningExportPopup from "modules/assistant/assets/images/hplanning/export_popup.png"

const hplanningAssistant = {
  name: "hplanning",
  steps: [
    {
      title: <>Exportez votre emploi du temps</>,
      description: (
        <>
          <p>
            Consultez votre emploi du temps en allant dans la rubrique "Cours".
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
      legend: <>Sélectionnez "Toutes les semaines publiées" et copiez l'URL.</>,
    },
  ],
}

export default hplanningAssistant
