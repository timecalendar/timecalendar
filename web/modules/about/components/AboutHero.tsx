export function AboutHero() {
  return (
    <section className="relative py-16 md:py-24 px-4 bg-gradient-to-br from-[#e66b8c] via-[#d55a7f] to-[#c44872] overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/5 to-transparent transform skew-x-12"></div>

      <div className="relative container mx-auto max-w-4xl text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg">
          À propos
        </h2>
        <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto drop-shadow-md">
          Une interface simple et intuitive pour vos emplois du temps
        </p>
      </div>
    </section>
  )
}
