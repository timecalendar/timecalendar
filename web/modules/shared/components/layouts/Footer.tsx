import Link from "next/link"

export function Footer() {
  return (
    <footer
      className="h-32 py-10 w-full text-center bg-[#2e2b2c] text-sm text-gray-400"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="mb-2">
        <span>Site créé par </span>
        <a
          href="https://samuelprak.fr/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-300 transition-colors duration-150 hover:text-slate-100 focus:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800 rounded-sm"
          aria-label="Site de Samuel Prak (ouvre dans un nouvel onglet)"
        >
          Samuel Prak
        </a>
      </div>

      <nav
        className="flex justify-center items-center gap-5"
        aria-label="Liens du pied de page"
      >
        <a
          href="https://status.timecalendar.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-300 transition-colors duration-150 hover:text-slate-100 focus:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800 rounded-sm"
          aria-label="Statut du service (ouvre dans un nouvel onglet)"
        >
          Statut
        </a>

        <Link
          href="/about"
          className="text-slate-300 transition-colors duration-150 hover:text-slate-100 focus:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800 rounded-sm"
        >
          À propos
        </Link>

        <Link
          href="/privacy-policy"
          className="text-slate-300 transition-colors duration-150 hover:text-slate-100 focus:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800 rounded-sm"
        >
          Politique de confidentialité
        </Link>
      </nav>
    </footer>
  )
}
