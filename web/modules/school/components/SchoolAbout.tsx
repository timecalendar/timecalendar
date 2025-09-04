import { formatUniversityName } from "@/modules/school/helpers/school"
import { SchoolForSeo } from "@timecalendar/api-client"
import { Award, MapPin, Users } from "lucide-react"

interface SchoolAboutProps {
  school: SchoolForSeo
}

type Stat = {
  icon: React.ElementType
  value: string
  label: string
  color: string
}

export function SchoolAbout({ school: { profile, name } }: SchoolAboutProps) {
  const stats = [
    profile?.studentCount && {
      icon: Users,
      value: `${Intl.NumberFormat("fr-FR").format(profile.studentCount)}+`,
      label: "Étudiants",
      color: "from-green-500 to-green-600",
    },
    profile?.campuses &&
      profile.campuses.length > 0 && {
        icon: MapPin,
        value: profile.campuses.length,
        label: "Campus",
        color: "from-purple-500 to-purple-600",
      },
    {
      icon: Award,
      value: "Excellence",
      label: "Académique",
      color: "from-[#e66b8c] to-[#c44872]",
    },
  ].filter(Boolean) as Stat[]

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            À propos de {formatUniversityName(name)}
          </h2>
          <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
            {profile?.description?.replace(
              "{universityName}",
              formatUniversityName(name),
            )}
          </p>
        </div>

        {/* Statistics */}
        {stats.length > 1 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div
                  className={`w-16 h-16 mx-auto bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4`}
                >
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-700">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Domains of study */}
        {profile?.domains && profile.domains.length > 0 && (
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Domaines d&apos;excellence
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {profile?.domains?.map((domain, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 text-center border border-gray-100 hover:border-[#c44872]/30 hover:shadow-lg transition-all duration-300 group cursor-default"
                >
                  <div className="text-2xl mb-2">📚</div>
                  <div className="font-medium text-gray-900 group-hover:text-[#c44872] transition-colors text-sm">
                    {domain}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional context for SEO */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
          {profile?.excellenceTitle && profile?.excellenceDescription && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {profile?.excellenceTitle}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {profile?.excellenceDescription?.replace(
                  "{universityName}",
                  formatUniversityName(name),
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {profile?.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#e66b8c]/10 text-[#c44872] rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Pourquoi choisir TimeCalendar ?
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Les emplois du temps universitaires peuvent vite devenir
              difficiles à suivre. TimeCalendar rassemble vos cours de l&apos;
              {name} dans une interface claire et moderne, pour que vous ayez
              toujours l&apos;information qu&apos;il vous faut, au bon moment.
            </p>
            <div className="bg-gradient-to-r from-[#e66b8c]/5 to-[#c44872]/5 rounded-2xl p-6 border border-[#c44872]/10">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#e66b8c] to-[#c44872] rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">
                  Déjà adopté par des milliers d&apos;étudiants
                </span>
              </div>
              <p className="text-sm text-gray-700">
                TimeCalendar est conçu pour vous accompagner au quotidien et
                rendre votre emploi du temps plus lisible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
