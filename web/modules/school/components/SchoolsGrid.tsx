"use client"

import { AppCTAs } from "@/modules/home/components/AppCTAs"
import { SchoolForList } from "@timecalendar/api-client"
import { Button } from "components/ui/button"
import { Input } from "components/ui/input"
import Fuse from "fuse.js"
import { ChevronRight, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

interface SchoolsGridProps {
  schools: SchoolForList[]
}

export function SchoolsGrid({ schools }: SchoolsGridProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    const options = {
      keys: [
        { name: "name", weight: 0.7 },
        { name: "seoUrl", weight: 0.3 },
      ],
      threshold: 0.3, // Lower = more strict matching
      includeScore: true,
      minMatchCharLength: 2,
    }
    return new Fuse(schools, options)
  }, [schools])

  const filteredSchools = useMemo(() => {
    if (!searchTerm.trim()) {
      return schools
    }

    const results = fuse.search(searchTerm)
    return results.map((result) => result.item)
  }, [schools, searchTerm, fuse])

  return (
    <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto max-w-7xl">
        {/* Search header */}
        <header className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Toutes les universités et écoles
          </h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Trouvez votre université parmi plus de 100 établissements
            d&apos;enseignement supérieur français et accédez facilement à votre
            emploi du temps personnalisé.
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto relative">
            <label htmlFor="school-search" className="sr-only">
              Rechercher un établissement d&apos;enseignement supérieur
            </label>
            <Input
              id="school-search"
              type="text"
              placeholder="Rechercher un établissement..."
              className="w-full px-6 py-4 rounded-2xl shadow-lg text-lg h-auto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Rechercher parmi les universités et écoles"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="w-8 h-8 bg-primary-400 rounded-xl flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Schools grid */}
        <main>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            role="list"
            aria-label={`Liste de ${filteredSchools.length} établissements d'enseignement supérieur`}
          >
            {filteredSchools.map((school) => (
              <article key={school.id} role="listitem" className="group">
                <Link
                  href={school.seoUrl ?? ""}
                  className="block h-full"
                  aria-label={`Voir l'emploi du temps de ${school.name}`}
                >
                  <div className="bg-white rounded-3xl p-8 shadow-md hover:shadow-lg transition-all duration-100 transform border border-gray-100 hover:border-primary-400 h-full">
                    {/* School logo */}
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center border border-gray-200 overflow-hidden">
                        {school.imageUrl ? (
                          <img
                            src={school.imageUrl}
                            alt={`Logo de ${school.name}`}
                            className="w-20 h-20 object-contain rounded-lg"
                            loading="lazy"
                            width={80}
                            height={80}
                          />
                        ) : (
                          <GraduationCap
                            className="h-10 w-10 text-gray-400"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </div>

                    {/* School info */}
                    <div className="text-center space-y-4">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors duration-100">
                        {school.name}
                      </h3>

                      {/* CTA */}
                      <div className="pt-4">
                        <Button
                          className="w-full"
                          size="lg"
                          aria-label={`Accéder à l'emploi du temps de ${school.name}`}
                        >
                          Voir l&apos;emploi du temps
                          <ChevronRight
                            className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300"
                            aria-hidden="true"
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </main>

        {filteredSchools.length === 0 && (
          <div className="text-center py-16" role="status" aria-live="polite">
            <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <GraduationCap
                className="h-12 w-12 text-gray-400"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Aucun établissement trouvé
            </h3>
            <p className="text-gray-600 mb-8">
              Essayez de modifier votre recherche ou{" "}
              <button
                onClick={() => setSearchTerm("")}
                className="text-[#c44872] hover:underline font-medium"
                aria-label="Réinitialiser la recherche pour voir tous les établissements"
              >
                voir tous les établissements
              </button>
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        <aside className="text-center mt-16">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Votre établissement n&apos;est pas listé ?
            </h3>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Pas de problème ! TimeCalendar fonctionne avec la plupart des
              établissements qui permettent l&apos;export iCal. Vous pouvez
              importer votre emploi du temps directement depuis votre système
              scolaire.
            </p>
            <div className="flex gap-4 justify-center">
              <AppCTAs />
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
