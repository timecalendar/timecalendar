import homeImg from "modules/home/assets/home.png"
import googlePlayImg from "modules/home/assets/google_play.png"
import appStoreImg from "modules/home/assets/app_store.png"
import Image from "next/image"

// test

const HomePage = () => (
  <div className="relative overflow-hidden h-screen px-[50px] py-0">
    <span className="hidden md:block">
      <div className="absolute z-[-1] w-3/5 min-h-0 h-full bg-[#e66b8c] skew-x-[8deg] origin-top-left right-0 inset-y-0"></div>
    </span>
    <div className="h-full flex items-center justify-between">
      <div className="max-w-[40%]">
        <div className="space-y-4">
          <div className="text-[42px] font-medium leading-[1.15em] mb-5">
            Consultez votre emploi du temps universitaire
          </div>
          <p>
            Consultez votre emploi du temps et recevez des notifications lors de
            modifications de cours grâce à votre nouvel assistant.
          </p>
          <p className="flex space-x-2">
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
          </p>
        </div>
      </div>
      <div className="max-w-[40%]">
        <Image src={homeImg} alt="" />
      </div>
    </div>
  </div>
)

export default HomePage
