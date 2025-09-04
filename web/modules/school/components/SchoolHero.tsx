import { AppCTAs } from "@/modules/home/components/AppCTAs"
import { formatUniversityName } from "@/modules/school/helpers/school"
import { SchoolForSeo } from "@timecalendar/api-client"
import { MapPin } from "lucide-react"

interface SchoolHeroProps {
  school: SchoolForSeo
}

export function SchoolHero({ school }: SchoolHeroProps) {
  return (
    <section className="relative py-16 md:py-24 px-4">
      <div className="relative container mx-auto max-w-6xl">
        <div
          className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12"
          id="school-hero-container"
        >
          <div className="space-y-8 text-center md:text-left md:flex-[0_1_60%]">
            <div className="flex justify-center md:justify-start mb-6">
              <div className="w-24 h-24 md:w-24 md:h-24 bg-gray-50 rounded-2xl flex items-center justify-center inset-shadow-xs border border-gray-300 overflow-hidden">
                {school.imageUrl && (
                  <img
                    src={school.imageUrl}
                    alt={`Logo ${school.name}`}
                    width={96}
                    height={96}
                    className="rounded-lg"
                  />
                )}
              </div>
            </div>

            {/* Main title */}
            <div className="space-y-4">
              <h2 className="text-4xl font-bold leading-12">
                Consultez votre emploi du temps
                <br />à{" "}
                <span className="text-primary">
                  {formatUniversityName(school.name)}
                </span>
              </h2>
              <p className="text-lg">
                Accédez facilement à vos cours et soyez averti des changements
                en temps réel.
              </p>
            </div>

            <div className="flex space-x-2 justify-center md:justify-start">
              <AppCTAs />
            </div>
          </div>

          <div className="flex justify-center md:flex-[1_1_40%]">
            <div className="min-w-96 max-w-96 md:max-w-none w-full aspect-square bg-primary-200 rounded-3xl inset-shadow-sm flex items-end justify-center">
              <div className="relative w-80 h-88 bg-black rounded-t-[2rem] border-6 border-b-0 border-gray-800 overflow-hidden">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-10"></div>
                <div className="w-full h-full bg-white rounded-t-[1rem]">
                  <div className="flex justify-between items-center px-6 py-2 text-xs font-semibold">
                    <span>9:41</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-black rounded-sm"></div>
                      <div className="w-4 h-2 rounded-sm">
                        <div className="w-full h-full bg-green-500 rounded-sm"></div>
                      </div>
                    </div>
                  </div>

                  {/* App Content Preview */}
                  <div className="px-3 py-2 h-full overflow-hidden">
                    {/* App Header */}
                    <div className="mb-4">
                      <p className="text-lg font-bold text-primary">
                        TimeCalendar
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        {school.name}
                      </p>
                      <p className="text-sm text-gray-900 font-bold">
                        3 cours aujourd&apos;hui
                      </p>
                    </div>

                    {/* Calendar Grid */}
                    <div className="relative">
                      {/* Time marks on the left */}
                      <div className="flex">
                        <div className="flex flex-col space-y-[1.75rem] mr-2 text-[10px] text-gray-400">
                          <span>8h</span>
                          <span>10h</span>
                          <span>12h</span>
                          <span>14h</span>
                          <span>16h</span>
                        </div>

                        {/* Calendar content area */}
                        <div className="flex-1 relative">
                          <div className="relative pt-1">
                            <div className="absolute top-1 left-0 right-0 h-12 bg-blue-200 rounded-sm mb-1 p-2 flex flex-col justify-center">
                              <div className="text-[0.75rem] font-medium">
                                Mathématiques
                              </div>
                              <div className="text-[0.75rem] flex items-center">
                                <MapPin className="h-3 w-3 mr-1" /> Salle A201
                              </div>
                            </div>
                            <div className="absolute top-[3.25rem] left-0 right-0 h-12 bg-green-200 rounded-sm mb-1 px-1 flex flex-col justify-center">
                              <div className="text-[0.75rem] font-medium">
                                Physique
                              </div>
                              <div className="text-[0.75rem] flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                Labo B105
                              </div>
                            </div>
                          </div>

                          <div className="absolute top-32 left-0 right-0 h-12 bg-orange-200 rounded-sm px-1 flex flex-col justify-center">
                            <div className="text-[0.75rem] font-medium">
                              TD Chimie
                            </div>
                            <div className="text-[0.75rem] flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              C302
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
