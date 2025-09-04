import { formatUniversityName } from "@/modules/school/helpers/school"
import { SchoolForSeo } from "@timecalendar/api-client"
import { GraduationCap, BookOpen } from "lucide-react"

interface SchoolFormationsProps {
  school: SchoolForSeo
}

export function SchoolFormations({
  school: { profile, name },
}: SchoolFormationsProps) {
  if (!profile || !profile.formations || profile.formations.length === 0)
    return null

  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#e66b8c] to-[#c44872] rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Emploi du temps par formation à {formatUniversityName(name)}
          </h2>
          <p className="text-lg text-gray-700 max-w-4xl mx-auto">
            Quelle que soit votre formation, TimeCalendar vous aide à consulter
            vos cours facilement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profile.formations.map((formation, index) => (
            <div
              key={index}
              className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 transition-all duration-300 transform"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{formation}</h3>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 text-sm mb-4">
                Emploi du temps {formation} – {name}
              </p>
            </div>
          ))}
        </div>

        {/* Additional formations teaser */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#e66b8c]/10 to-[#c44872]/10 px-6 py-3 rounded-full border border-[#c44872]/20">
            <GraduationCap className="h-5 w-5 text-[#c44872]" />
            <span className="text-[#c44872] font-medium">
              + de nombreuses autres formations disponibles
            </span>
          </div>
        </div>

        {/* Long tail SEO content */}
        <div className="mt-16 bg-gray-50 rounded-3xl p-8 md:p-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Toutes vos formations {name} dans TimeCalendar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Formations initiales
              </h4>
              <p className="text-sm leading-relaxed">
                Retrouvez tous vos cours de première année à la dernière année
                avec les horaires exacts, les salles et les changements en temps
                réel. Accessible pour tous types de cursus et spécialisations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Formations spécialisées et avancées
              </h4>
              <p className="text-sm leading-relaxed">
                Accédez à vos emplois du temps spécialisés, avec les séminaires,
                les soutenances, les stages et tous les événements académiques
                importants. Adapté à votre parcours d&apos;études.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
