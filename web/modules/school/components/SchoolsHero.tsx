import { GraduationCap, MapPin, Users, ArrowDown } from "lucide-react"

export function SchoolsHero() {
  return (
    <section className="relative py-16 px-4 bg-gradient-to-br from-[#e66b8c] via-[#d55a7f] to-[#c44872] overflow-hidden">
      <div className="relative container mx-auto max-w-6xl text-center">
        <div className="space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Main heading */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Choisissez votre
              <br />
              <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                établissement
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Sélectionnez votre université et accédez à votre emploi du temps
              personnalisé
            </p>
          </div>

          {/* Stats */}
          <div className="hidden md:flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 pt-8">
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-white">50k+</div>
                <div className="text-sm text-white/80">Étudiants</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-white">100+</div>
                <div className="text-sm text-white/80">Établissements</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-white/90">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm text-white/80">Formations</div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="pt-8">
            <div className="flex justify-center animate-bounce">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowDown className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
