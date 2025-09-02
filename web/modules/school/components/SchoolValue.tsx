import { CalendarPlus, Clock, Layers, RefreshCw } from "lucide-react"
import Image from "next/image"
import appMockup from "modules/home/assets/mockup.png"

const benefits = [
  {
    icon: Clock,
    title: "Une expérience claire",
    description:
      "Votre emploi du temps présenté dans une interface simple et agréable à utiliser.",
  },
  {
    icon: RefreshCw,
    title: "Toujours à jour",
    description:
      "Vos cours, TD et CM sont automatiquement synchronisés, même en cas de changement.",
  },
  {
    icon: CalendarPlus,
    title: "Ajoutez vos événements personnels",
    description:
      "Complétez votre emploi du temps avec vos propres rendez-vous et activités.",
  },
  {
    icon: Layers,
    title: "Calendriers multiples",
    description:
      "Importez plusieurs groupes ou filières et gérez-les facilement au même endroit.",
  },
]

interface SchoolValueProps {
  universityName: string
}
export function SchoolValue({ universityName }: SchoolValueProps) {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Utiliser TimeCalendar à {universityName}
          </h2>
          <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Avec TimeCalendar, votre emploi du temps à l&apos;{universityName}{" "}
            est toujours accessible et à jour. Vos cours, TD et CM apparaissent
            automatiquement sur votre smartphone, même en cas de changement.
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-10 gap-12 items-center">
          <div className="space-y-8 lg:col-span-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 w-14 h-14 bg-[#c44872] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <benefit.icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#c44872] transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="w-full max-w-sm mx-auto lg:col-span-4">
            <Image src={appMockup} alt="App mockup" />
          </div>
        </div>
      </div>
    </section>
  )
}
