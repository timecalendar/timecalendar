import { Feature } from "modules/shared/components/ui/Feature"
import { faPlug, faCogs, faSync } from "@fortawesome/free-solid-svg-icons"

export function AboutProcess() {
  return (
    <section className="py-16 md:py-24 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
          Fonctionnement
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <Feature icon={faPlug} title="Connexion directe">
            Nous nous connectons directement au calendrier de votre
            établissement, afin de récupérer et d&apos;afficher la dernière
            version de votre emploi du temps.
          </Feature>

          <Feature icon={faCogs} title="Traitement et affichage">
            Nous traitons les données de votre établissement afin de proposer un
            emploi du temps clair et compréhensible.
          </Feature>

          <Feature icon={faSync} title="Synchronisation permanente">
            Grâce à notre connexion, nous récupérons en temps réel les dernières
            modifications de votre emploi du temps.
          </Feature>
        </div>
      </div>
    </section>
  )
}
