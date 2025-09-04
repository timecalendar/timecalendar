import { AppCTAs } from "@/modules/home/components/AppCTAs"
import { Globe, Star } from "lucide-react"

interface Testimonial {
  quote: string
  author: string
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Enfin fini les galères avec l'ENT ! Mon emploi du temps est toujours à jour sur mon téléphone.",
    author: "Julie, Licence Droit",
  },
  {
    quote:
      "Super pratique pour organiser ma semaine. Les notifications me sauvent la vie !",
    author: "Thomas, Master Économie",
  },
  {
    quote:
      "Interface claire et moderne. Exactement ce qu'il fallait pour mes études !",
    author: "Sarah, Licence Lettres",
  },
]

interface SchoolCTAProps {
  schoolName: string
}

export function SchoolCTA({ schoolName }: SchoolCTAProps) {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-[#e66b8c] via-[#d55a7f] to-[#c44872] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>

      <div className="relative container mx-auto max-w-6xl">
        <div className="text-center space-y-8">
          {/* Main CTA message */}
          <div className="space-y-6">
            <div className="flex justify-center space-x-1 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-6 w-6 text-yellow-300 fill-current"
                />
              ))}
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight drop-shadow-lg">
              Accédez à vos cours en toute simplicité
            </h2>
            <p className="text-xl md:text-2xl font-medium text-white/90 mx-auto leading-relaxed drop-shadow-md">
              Accédez dès aujourd&apos;hui à votre emploi du temps {schoolName}
            </p>
          </div>

          {/* Download buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <AppCTAs />
          </div>

          {/* Web app teaser */}
          <div className="pt-8">
            <div className="inline-flex items-center space-x-3 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm border border-white/20">
              <Globe className="h-5 w-5 text-white" />
              <span className="text-white font-medium">
                💻 Disponible bientôt aussi sur le web !
              </span>
            </div>
          </div>

          {/* Social proof */}
          <div className="pt-8 space-y-4">
            <p className="text-white/80 text-lg">
              Rejoignez les{" "}
              <span className="font-bold text-white">
                milliers d&apos;étudiants
              </span>{" "}
              qui utilisent déjà TimeCalendar
            </p>

            {/* Testimonial cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                >
                  <div className="flex space-x-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 text-yellow-300 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-white/90 text-sm italic mb-3">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  <p className="text-white/70 text-xs">
                    — {testimonial.author}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
