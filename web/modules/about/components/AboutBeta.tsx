import mockupImg from "modules/home/assets/mockup.png"
import Image from "next/image"

export function AboutBeta() {
  return (
    <section className="py-16 md:py-24 px-4 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
          Bêta fermée
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Nous recherchons des bêta testeurs !
            </h3>

            <p className="leading-relaxed">
              Pour améliorer la vie universitaire et offrir aux étudiants la
              meilleure expérience utilisateur, nous recherchons des testeurs
              pour la nouvelle version de notre application Android et iOS.
            </p>

            <p className="leading-relaxed">
              En tant que testeur de l&apos;application, vous obtiendrez en
              avant-première les nouvelles fonctionnalités. Vous pourrez ainsi
              tester les dernières nouveautés et donner vos retours.
            </p>

            <div className="pt-4">
              <a
                href="https://forms.gle/bMR4RWsnsTB5nU1z7"
                className="inline-flex items-center px-6 py-3 bg-[#e66b8c] text-white font-medium rounded-lg hover:bg-[#d55a7f] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#e66b8c] focus:ring-offset-2"
              >
                S&apos;inscrire à la bêta fermée
              </a>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              <Image
                src={mockupImg}
                alt="Mockup TimeCalendar"
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
