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
            Consultez votre emploi du temps en allant dans la rubrique
            &quot;Cours&quot;.
          </p>
          <p>En haut à droite, cliquez sur l&apos;icône Agenda.</p>
        </>
      ),
      image: hplanningExportIcon,
      legend: <>En haut à droite, cliquez sur le calendrier.</>,
    },
    {
      title: <>Configurez l&apos;exportation</>,
      description: (
        <>
          <p>
            Dans la fenêtre qui s&apos;ouvre, laissez coché{" "}
            <strong>Toutes les semaines publiées</strong>.
          </p>
          <p>Copiez ensuite l&apos;URL qui apparaît dans la zone de texte.</p>
        </>
      ),
      image: hplanningExportPopup,
      legend: (
        <>
          Sélectionnez &quot;Toutes les semaines publiées&quot; et copiez
          l&apos;URL.
        </>
      ),
    },
  ],
}

export default hplanningAssistant
