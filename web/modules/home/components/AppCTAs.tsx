import Image from "next/image"
import appStoreImg from "modules/home/assets/app_store.png"
import googlePlayImg from "modules/home/assets/google_play.png"

export function AppCTAs() {
  return (
    <>
      <a
        href="https://apps.apple.com/us/app/timecalendar/id1479613630?l=fr"
        target="_blank"
      >
        <Image
          alt="Télécharger dans l'App Store"
          src={appStoreImg}
          height={50}
        />
      </a>
      <a
        href="https://play.google.com/store/apps/details?id=fr.samuelprak.timecalendar"
        target="_blank"
      >
        <Image
          alt="Disponible sur Google Play"
          src={googlePlayImg}
          height={50}
        />
      </a>
    </>
  )
}
