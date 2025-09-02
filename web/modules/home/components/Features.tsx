import {
  faCalendarDays,
  faBell,
  faMobileScreen,
} from "@fortawesome/free-solid-svg-icons"
import { useId } from "react"
import { Feature } from "modules/shared/components/ui/Feature"

export function Features() {
  const id = useId()

  return (
    <section className="py-24 px-8 bg-gray-50" aria-labelledby={id}>
      <div className="container mx-auto max-w-7xl">
        <h2 id={id} className="sr-only">
          Fonctionnalités de TimeCalendar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Feature
            icon={faCalendarDays}
            title="Consultez votre emploi du temps"
          >
            Accédez facilement à votre emploi du temps universitaire. Nous
            récupérons votre calendrier directement auprès de votre
            établissement.
          </Feature>

          <Feature icon={faBell} title="Recevez des notifications">
            Pour ne plus rater de changements, soyez notifié lors d&apos;un
            ajout, d&apos;une modification ou d&apos;une suppression de cours.
          </Feature>

          <Feature icon={faMobileScreen} title="Disponible sur smartphone">
            TimeCalendar est aussi disponible sur{" "}
            <a
              href="https://play.google.com/store/apps/details?id=fr.samuelprak.timecalendar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Android
            </a>{" "}
            et{" "}
            <a
              href="https://apps.apple.com/us/app/timecalendar/id1479613630?l=fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              iOS
            </a>{" "}
            ! Consultez à tout moment votre emploi du temps sur votre
            smartphone.
          </Feature>
        </div>
      </div>
    </section>
  )
}
