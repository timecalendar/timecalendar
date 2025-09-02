import { AppCTAs } from "@/modules/home/components/AppCTAs"
import { Calendar, CheckCircle, Download, Search } from "lucide-react"

interface SchoolTutorialProps {
  universityName: string
}

export function SchoolTutorial({ universityName }: SchoolTutorialProps) {
  const steps = [
    {
      icon: Download,
      title: "Téléchargez l'application",
      description: "Installez TimeCalendar depuis l'App Store ou le Play Store",
      color: "bg-gray-700",
    },
    {
      icon: Search,
      title: "Sélectionnez votre université",
      description: `Choisissez "${universityName}" dans la liste des universités`,
      color: "bg-gray-700",
    },
    {
      icon: Calendar,
      title: "Consultez vos cours",
      description:
        "Accédez directement à vos cours et soyez informé des changements",
      color: "bg-gray-700",
    },
  ]

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-100 to-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Comment accéder à votre emploi du temps ?
          </h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto">
            En seulement 3 étapes simples, accédez à tous vos cours
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              {/* Step number */}
              <div className="relative mb-6">
                <div
                  className={`w-20 h-20 mx-auto ${step.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300`}
                >
                  <step.icon className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center font-bold text-sm text-gray-700">
                  {index + 1}
                </div>
              </div>

              {/* Step content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-[#c44872] transition-colors">
                {step.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Votre emploi du temps toujours à portée de main
          </h3>
          <p className="text-lg text-gray-800 mb-8 max-w-2xl mx-auto">
            Rejoignez les milliers d&apos;étudiants qui utilisent déjà
            TimeCalendar pour gérer leur emploi du temps.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <AppCTAs />
          </div>
        </div>
      </div>
    </section>
  )
}
