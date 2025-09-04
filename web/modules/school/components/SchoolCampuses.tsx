import { formatUniversityName } from "@/modules/school/helpers/school"
import { SchoolForSeo } from "@timecalendar/api-client"
import { MapPin, Users } from "lucide-react"

interface SchoolCampusesProps {
  school: SchoolForSeo
}

export function SchoolCampuses({
  school: { profile, name },
}: SchoolCampusesProps) {
  if (!profile || !profile.campuses || profile.campuses.length === 0)
    return null

  return (
    <section className="py-16 px-4 bg-gray-100">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Les campus de {formatUniversityName(name)}
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            {formatUniversityName(name)} compte plusieurs campus répartis{" "}
            {profile?.campusLocationContext
              ? `en ${profile.campusLocationContext}`
              : "dans la région"}
            . Retrouvez facilement votre emploi du temps selon votre campus et
            vos cours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profile?.campuses?.map((campus, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{campus.name}</h3>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {campus.location}
              </p>
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center text-[#c44872] text-sm font-medium">
                  <Users className="h-4 w-4 mr-1" />
                  Voir les emplois du temps
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
