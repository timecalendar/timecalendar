"use client"

import { useState } from "react"
import {
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Home,
  MapPin,
  MoreHorizontal,
  Plus,
  Settings,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"

import styles from "./page.module.css"

const events = [
  { name: "Algorithmique", meta: "08:30–10:00 · B204", color: "blue" },
  {
    name: "Design d’interface",
    meta: "10:15–11:45 · Studio 3",
    color: "violet",
  },
  { name: "Anglais", meta: "13:30–15:00 · A113", color: "coral" },
]

type Platform = "ios" | "android"
type Theme = "light" | "dark"

function StatusBar() {
  return (
    <div className={styles.statusBar} aria-hidden="true">
      <span>9:41</span>
      <span className={styles.statusIcons}>● ◒ ▰</span>
    </div>
  )
}

function CalendarMark() {
  return (
    <div className={styles.calendarMark} aria-hidden="true">
      <span className={`${styles.markTile} ${styles.blue}`} />
      <span className={`${styles.markTile} ${styles.violet}`} />
      <span className={`${styles.markTile} ${styles.coral}`} />
      <span className={`${styles.markTile} ${styles.green}`} />
    </div>
  )
}

function TabBar({ active }: { active: "home" | "calendar" | "settings" }) {
  return (
    <nav className={styles.tabBar} aria-label="Mock mobile navigation">
      <span className={active === "home" ? styles.activeTab : undefined}>
        <Home size={20} strokeWidth={active === "home" ? 2.6 : 2} />
        Accueil
      </span>
      <span className={active === "calendar" ? styles.activeTab : undefined}>
        <CalendarDays size={20} strokeWidth={active === "calendar" ? 2.6 : 2} />
        Calendrier
      </span>
      <span className={active === "settings" ? styles.activeTab : undefined}>
        <Settings size={20} strokeWidth={active === "settings" ? 2.6 : 2} />
        Réglages
      </span>
    </nav>
  )
}

function Phone({
  children,
  label,
  platform,
  theme,
}: {
  children: React.ReactNode
  label: string
  platform: Platform
  theme: Theme
}) {
  return (
    <article className={styles.mockup}>
      <div className={styles.phone} data-platform={platform} data-theme={theme}>
        <span className={styles.platformBadge}>
          {platform === "ios" ? "iOS" : "Android"}
        </span>
        {children}
      </div>
      <p>{label}</p>
    </article>
  )
}

function HomeScreen({ platform, theme }: { platform: Platform; theme: Theme }) {
  return (
    <Phone
      label="Home · pastel event surfaces, without decorative borders"
      platform={platform}
      theme={theme}
    >
      <StatusBar />
      <main className={styles.screen}>
        <header className={styles.brandRow}>
          <div className={styles.brandLockup}>
            <CalendarMark />
            <span>TimeCalendar</span>
          </div>
          <button className={styles.iconButton} aria-label="Notifications">
            {platform === "ios" ? <Plus size={20} /> : <Bell size={20} />}
          </button>
        </header>

        <section className={styles.hero}>
          <div className={styles.logoMosaic} aria-hidden="true">
            <i className={styles.mosaicBlue} />
            <i className={styles.mosaicViolet} />
            <i className={styles.mosaicGreen} />
            <i className={styles.mosaicYellow} />
          </div>
          <p className={styles.eyebrow}>JEUDI 6 AOÛT</p>
          <h2>Bonjour Samuel</h2>
          <p>Une journée bien remplie, mais tout est sous contrôle.</p>
          <div className={styles.daySummary}>
            <span className={styles.eventDots} aria-hidden="true">
              <i className={styles.blue} />
              <i className={styles.violet} />
              <i className={styles.coral} />
            </span>
            <strong>3 cours aujourd’hui</strong>
          </div>
        </section>

        <div className={styles.sectionHeading}>
          <h3>À suivre</h3>
          <span>Tout voir</span>
        </div>
        <div className={styles.cardScroller}>
          {events.slice(0, 2).map((event) => (
            <div
              className={`${styles.eventCard} ${styles[event.color]}`}
              key={event.name}
            >
              <span className={styles.cardTime}>
                {event.meta.split(" · ")[0]}
              </span>
              <strong>{event.name}</strong>
              <span>{event.meta.split(" · ")[1]}</span>
            </div>
          ))}
        </div>

        <div className={styles.sectionHeading}>
          <h3>Aujourd’hui</h3>
          {platform === "ios" && (
            <span className={styles.textButton}>Modifier</span>
          )}
        </div>
        <div className={styles.miniTimeline}>
          <span>08:00</span>
          <i />
          <span>09:00</span>
          <div className={`${styles.timelineEvent} ${styles.blue}`}>
            Algorithmique
          </div>
          <span>10:00</span>
          <i />
          <span>11:00</span>
          <div className={`${styles.timelineEvent} ${styles.violet}`}>
            Design d’interface
          </div>
        </div>
      </main>
      {platform === "android" && (
        <button className={styles.floatingButton}>
          <Plus size={22} />
        </button>
      )}
      <TabBar active="home" />
    </Phone>
  )
}

function AgendaScreen({
  platform,
  theme,
}: {
  platform: Platform
  theme: Theme
}) {
  const days = ["L", "M", "M", "J", "V", "S", "D"]
  return (
    <Phone
      label="Agenda · native action placement changes by platform"
      platform={platform}
      theme={theme}
    >
      <StatusBar />
      <main className={styles.screen}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>AOÛT 2026</p>
            <h2>Calendrier</h2>
          </div>
          <button className={styles.iconButton} aria-label="Calendar options">
            {platform === "ios" ? (
              <Plus size={20} />
            ) : (
              <SlidersHorizontal size={20} />
            )}
          </button>
        </header>

        <div className={styles.weekStrip}>
          {days.map((day, index) => (
            <div
              className={index === 3 ? styles.today : undefined}
              key={`${day}-${index}`}
            >
              <span>{day}</span>
              <strong>{index + 3}</strong>
              {index === 3 && <i />}
            </div>
          ))}
        </div>

        <div className={styles.agendaHeading}>
          <div>
            <strong>Jeudi 6</strong>
            <span>3 événements</span>
          </div>
          <span className={styles.weather}>22° ☀</span>
        </div>

        <div className={styles.agendaList}>
          {events.map((event) => (
            <div className={styles.agendaRow} key={event.name}>
              <span className={styles.agendaTime}>
                {event.meta.split("–")[0]}
              </span>
              <i className={`${styles.sourceDot} ${styles[event.color]}`} />
              <div>
                <strong>{event.name}</strong>
                <span>
                  <MapPin size={13} /> {event.meta.split(" · ")[1]}
                </span>
              </div>
              <ChevronRight size={17} />
            </div>
          ))}
        </div>

        {platform === "android" && (
          <button
            className={styles.floatingButton}
            aria-label="Ajouter un événement"
          >
            <Plus size={22} />
          </button>
        )}
      </main>
      <TabBar active="calendar" />
    </Phone>
  )
}

function EventDetailsScreen({
  platform,
  theme,
}: {
  platform: Platform
  theme: Theme
}) {
  return (
    <Phone
      label="Event details · one contextual pastel, never a rainbow"
      platform={platform}
      theme={theme}
    >
      <StatusBar />
      <main className={styles.screen}>
        <header className={styles.compactNav}>
          <button>
            <ChevronLeft size={22} />
            Calendrier
          </button>
          <button className={styles.iconButton} aria-label="More options">
            <MoreHorizontal size={21} />
          </button>
        </header>

        <section className={`${styles.detailHero} ${styles.violet}`}>
          <span className={styles.detailLabel}>
            <Sparkles size={14} /> PROCHAIN COURS
          </span>
          <h2>Design d’interface</h2>
          <p>
            Une couleur douce donne le contexte. Le texte reste neutre et
            lisible.
          </p>
        </section>

        <section className={styles.detailGroup}>
          <div className={styles.detailRow}>
            <span className={`${styles.detailIcon} ${styles.violet}`}>
              <Clock3 size={18} />
            </span>
            <div>
              <span>Horaire</span>
              <strong>10:15 – 11:45</strong>
            </div>
          </div>
          <div className={styles.detailRow}>
            <span className={`${styles.detailIcon} ${styles.violet}`}>
              <MapPin size={18} />
            </span>
            <div>
              <span>Lieu</span>
              <strong>Studio 3 · Bâtiment Création</strong>
            </div>
          </div>
          <div className={styles.detailRow}>
            <span className={`${styles.detailIcon} ${styles.violet}`}>
              <CalendarDays size={18} />
            </span>
            <div>
              <span>Calendrier</span>
              <strong>Master Interaction</strong>
            </div>
          </div>
        </section>

        <section className={styles.noteCard}>
          <div>
            <Check size={16} />
            <strong>À préparer</strong>
          </div>
          <p>Apporter les premiers wireframes et les retours utilisateurs.</p>
        </section>
        <button className={styles.primaryButton}>Modifier l’événement</button>
      </main>
      <div className={styles.homeIndicator} />
    </Phone>
  )
}

function SourcesScreen({
  platform,
  theme,
}: {
  platform: Platform
  theme: Theme
}) {
  const sources = [
    {
      title: "Master Interaction",
      subtitle: "12 calendriers",
      color: "violet",
    },
    { title: "Cours communs", subtitle: "8 calendriers", color: "blue" },
    { title: "Personnel", subtitle: "3 événements", color: "coral" },
  ]
  return (
    <Phone
      label="Sources · color identifies content, pink identifies actions"
      platform={platform}
      theme={theme}
    >
      <StatusBar />
      <main className={styles.screen}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>MES DONNÉES</p>
            <h2>Calendriers</h2>
          </div>
          <button className={styles.textButton}>Modifier</button>
        </header>

        <section className={styles.sourceSummary}>
          <CalendarMark />
          <div>
            <strong>23 calendriers synchronisés</strong>
            <span>Mis à jour il y a 2 min</span>
          </div>
          <Check size={18} />
        </section>

        <h3 className={styles.listTitle}>Sources actives</h3>
        <div className={styles.sourceList}>
          {sources.map((source) => (
            <div className={styles.sourceRow} key={source.title}>
              <i className={`${styles.sourceDot} ${styles[source.color]}`} />
              <div>
                <strong>{source.title}</strong>
                <span>{source.subtitle}</span>
              </div>
              <span className={styles.nativeSwitch}>
                <i />
              </span>
            </div>
          ))}
        </div>

        <button className={styles.outlineButton}>
          <Plus size={18} /> Ajouter un calendrier
        </button>
        <p className={styles.helper}>
          Les couleurs servent à reconnaître vos calendriers. Les interrupteurs
          restent natifs et utilisent la couleur de marque.
        </p>
      </main>
      <TabBar active="settings" />
    </Phone>
  )
}

export default function CalendarConfettiMockups() {
  const [theme, setTheme] = useState<Theme>("light")
  const [platform, setPlatform] = useState<Platform>("ios")

  return (
    <main className={styles.canvas}>
      <header className={styles.intro}>
        <span className={styles.kicker}>TIMECALENDAR · VISUAL EXPLORATION</span>
        <h1>Calendar Confetti</h1>
        <p>
          Pink says “TimeCalendar.” The spectrum says “your day.” Native
          surfaces keep both of them calm.
        </p>
        <div className={styles.legend}>
          <span>
            <i className={styles.brandSwatch} />
            Brand & actions
          </span>
          <span>
            <i className={styles.spectrumSwatch} />
            Events & context
          </span>
          <span>
            <i className={styles.neutralSwatch} />
            Native surfaces
          </span>
        </div>
        <div className={styles.previewControls}>
          <div>
            <button
              className={theme === "light" ? styles.selectedControl : undefined}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              className={theme === "dark" ? styles.selectedControl : undefined}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
          </div>
          <div>
            <button
              className={
                platform === "ios" ? styles.selectedControl : undefined
              }
              onClick={() => setPlatform("ios")}
            >
              iOS
            </button>
            <button
              className={
                platform === "android" ? styles.selectedControl : undefined
              }
              onClick={() => setPlatform("android")}
            >
              Android
            </button>
          </div>
        </div>
      </header>

      <section className={styles.gallery}>
        <HomeScreen platform={platform} theme={theme} />
        <AgendaScreen platform={platform} theme={theme} />
        <EventDetailsScreen platform={platform} theme={theme} />
        <SourcesScreen platform={platform} theme={theme} />
      </section>

      <footer className={styles.rules}>
        <div>
          <strong>Dot</strong>
          <span>Identity</span>
        </div>
        <div>
          <strong>Edge</strong>
          <span>Association</span>
        </div>
        <div>
          <strong>Wash</strong>
          <span>Context</span>
        </div>
        <div>
          <strong>Block</strong>
          <span>Calendar content</span>
        </div>
        <div>
          <strong>Pink</strong>
          <span>Brand and action</span>
        </div>
      </footer>
    </main>
  )
}
