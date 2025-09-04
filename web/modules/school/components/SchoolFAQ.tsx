"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"
import { formatUniversityName } from "@/modules/school/helpers/school"

interface SchoolFAQProps {
  universityName: string
}

interface FAQItem {
  question: string
  answer: string
}

export function SchoolFAQ({ universityName }: SchoolFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs: FAQItem[] = [
    {
      question: `Comment consulter mon emploi du temps ${universityName} sur mobile ?`,
      answer: `Avec TimeCalendar, choisissez simplement "${universityName}" dans l'app. Votre emploi du temps s'affiche automatiquement avec tous vos cours, TD et TP.`,
    },
    {
      question: "Puis-je voir mes cours, TD et TP dans l'application ?",
      answer:
        "Oui, TimeCalendar récupère vos différents groupes (cours magistraux, TD, TP) et les affiche clairement avec les horaires et salles correspondantes.",
    },
    {
      question: `Est-ce gratuit pour les étudiants de ${formatUniversityName(universityName)} ?`,
      answer:
        "Oui, l'application TimeCalendar est entièrement gratuite au téléchargement et à l'utilisation pour tous les étudiants.",
    },
    {
      question: `Et si ${formatUniversityName(universityName)} modifie mon emploi du temps ?`,
      answer:
        "L'emploi du temps se met à jour automatiquement en temps réel. Vous recevez même des notifications pour les changements importants.",
    },
    {
      question: "Puis-je ajouter plusieurs emplois du temps ?",
      answer:
        "Absolument ! Vous pouvez ajouter plusieurs groupes, options ou même d'autres universités si vous suivez des cours dans plusieurs établissements.",
    },
    {
      question: "L'application fonctionne-t-elle hors ligne ?",
      answer:
        "Oui, une fois vos cours synchronisés, vous pouvez consulter votre emploi du temps même sans connexion internet.",
    },
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-100 to-white">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#e66b8c] to-[#c44872] rounded-2xl flex items-center justify-center shadow-lg">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Questions fréquentes
          </h2>
          <p className="text-lg text-gray-600">
            Tout ce que vous devez savoir sur TimeCalendar pour {universityName}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`h-6 w-6 text-[#c44872] transition-transform duration-300 flex-shrink-0 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6">
                  <div className="h-px bg-gradient-to-r from-gray-200 to-transparent mb-4"></div>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional help section */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-[#e66b8c]/10 to-[#c44872]/10 rounded-2xl p-8 border border-[#c44872]/20">
            <HelpCircle className="h-12 w-12 text-[#c44872] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Une autre question ?
            </h3>
            <p className="text-gray-600 mb-4">
              Besoin d&apos;aide ou d&apos;un renseignement ? Notre équipe est
              disponible pour vous répondre.
            </p>
            <a
              href="mailto:hello@timecalendar.app"
              className="text-[#c44872] font-medium hover:underline"
            >
              Nous contacter →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
