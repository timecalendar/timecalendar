# 2 — Screens & flows

This is the inventory of every screen in the current app, plus the end-to-end journeys that
connect them. It's written so you can understand *what the user sees and does* without reading
code. French UI labels are quoted as they appear today (with an English gloss).

> **Reading tip:** the **navigation backbone** comes first — it's the frame everything else
> hangs on. Then the major flows. Then a screen-by-screen reference.

---

## The navigation backbone

After launch, the app's home base is a **3-tab bottom navigation bar** (a classic Material
bottom nav). The three tabs are always visible:

1. **Accueil** (Home) — the "today / what's next" landing view. *(house icon)*
2. **Calendrier** (Calendar) — the full week / agenda calendar. *(calendar icon)*
3. **Profil** (Profile) — settings, calendars, activity, about, feedback. *(person icon)*

A **floating "+" button (FAB)** appears **only on the Calendar tab**, bottom-right, to add a
personal event (tooltip: *"Ajouter un événement"*).

Everything else (event details, settings, onboarding, importing a calendar, etc.) opens as a
**pushed screen on top** of this tab frame, typically with its own header and a back arrow.

> **Designer note:** this 3-tab bottom bar + FAB + pushed detail screens is a *Material*
> structure. On iOS it should likely become a native tab bar (and the "add" affordance may move
> into a navigation-bar button rather than a floating button). See
> [04-material-to-native.md](./04-material-to-native.md).

---

## Major flows

### Flow A — First launch & importing your timetable (onboarding)

This is the make-or-break flow: a brand-new user has to get their school timetable into the app.

1. **Splash.** App logo centered on screen for ~1 second while data loads.
2. **Onboarding carousel** (only if no calendar exists yet). A 3-slide swipeable intro on a
   **pink gradient background** (`#F76262 → #E66B9A`), each slide with an illustration + a
   headline + a sentence:
   - Slide 1 — *"Consultez votre agenda"* ("Check your schedule"): "We fetch your calendar
     directly from your school." (illustration: `home.png`)
   - Slide 2 — *"Recevez des notifications"* ("Get notifications"): "Be alerted when a class is
     added, changed, or cancelled." (illustration: `notifications.png`)
   - Slide 3 — *"Bienvenue dans TimeCalendar !"*: "View your university timetable."
     (illustration: `schools.png`)
   - Top-right **"Passer"** (Skip) on slides 1–2; page-indicator dots (active dot is an
     elongated pink pill); a **"C'est parti !"** ("Let's go!") button on the final slide.
3. **School selection.** A searchable list of schools (search field: *"Rechercher un
   établissement"*). Each row is a school (with logo). At the bottom: *"Établissement non trouvé
   ?"* ("School not found?").
4. **Import path branches:**
   - **School found →** an **Assistant** screen (an embedded web view titled *"Importer votre
     calendrier"*) where the student logs into their school system; the calendar is created and
     the app returns to Home automatically.
   - **School not found →** **Add school** (enter the school name) → **Add grade/program**
     (enter the program name) → Assistant.
   - **Alternative imports** also exist: **scan a QR code** (camera) or **paste an iCal URL**
     manually (see the Import screens below).
5. **Done.** The student lands on Home with their week imported.

> This flow has the most screens and the most "Material assistant" feel (expandable
> `SliverAppBar` headers, "Retour / Suivant" button pairs at the bottom). It's a prime
> candidate for a native multi-step flow redesign.

### Flow B — Daily use: glance, then browse

1. **Home (Accueil).** Opens to:
   - A header: **"TimeCalendar"** + a line like *"5 cours aujourd'hui"* ("5 classes today") or
     *"Pas de cours à venir"* ("No upcoming classes").
   - A **horizontal scroller** of upcoming-event cards (time, title, room, a small checklist
     indicator dot).
   - A **"today" mini-timeline**: a vertical hour-by-hour grid of today's classes as colored
     blocks, with a **red "now" line** at the current time.
   - **Pull-to-refresh** re-syncs the calendar (toast: *"Calendrier rechargé."* / *"Aucune
     connexion."* on failure).
2. **Calendar (Calendrier).** A header shows the **month + year** ("Janvier 2024"), an
   **"Aujourd'hui"** (Today) button to jump back, and an overflow menu (*"Rafraîchir"* /
   *"Modifier les calendriers"*). The body is one of two views (set in Settings):
   - **Week view:** a horizontal 5- or 7-day grid (weekends toggle), left hour column (8h–18h),
     events as colored rounded blocks positioned by time; swipe to change weeks.
   - **Planning/agenda view:** a vertical day-by-day list with a time grid and a current-time
     indicator.
3. **Tap any event → Event details** (see Flow C).
4. **Add a personal event** via the FAB on the Calendar tab (see Flow D).

### Flow C — Event details, checklist, hide

1. From Home or Calendar, **tap an event** → the **Event details** screen.
2. It shows: **title + time**, optional **tags** (pills, e.g. CM/TD/TP), then content lines with
   icons — **location** (room), **calendar name** (if the user has several), **teacher(s)**,
   **description**.
3. **Checklist** section: a reorderable list of to-do items, each with a drag handle, a
   checkbox, inline-editable text, and a remove (×). An **"add item"** affordance appends a new
   item and auto-focuses it.
4. **Overflow menu (⋯), top-right** — actions depend on event type:
   - **Imported class →** *"Masquer"* (Hide). Opens a chooser: hide *this* instance, or hide
     *all events with this name*.
   - **Personal event →** *"Modifier"* (Edit) and *"Supprimer"* (Delete, with a confirm dialog).

### Flow D — Create / edit a personal event

1. Tap the **FAB "+"** on the Calendar tab (or "Modifier" on a personal event).
2. A form screen with: **title** (large field), a **date** picker, **start** and **end** time
   pickers (the end label turns **red** if it's before the start), **location**, **description**,
   and a **color** picker (opens a Material color swatch dialog).
3. **Save** ("Enregistrer", top-right) validates (title required; end after start) and writes
   locally. **Close (×)** discards.

### Flow E — Manage calendars

- Reached from **Profile → "Calendriers"** or **Calendar overflow → "Modifier les calendriers"**.
- **Mes calendriers** lists each imported calendar with a **visibility checkbox**, a name, and a
  subtitle (school name or "personal calendar"). **Swipe-to-delete** (red background) or
  **long-press** for a delete menu; **confirm dialog** before delete. A **FAB "+"** starts the
  import flow again.

### Flow F — Settings & preferences

Reached from **Profile → "Paramètres"**. A settings list (Material `PrefPage`) with:

- **Notifications** (currently disabled, with an explanatory note).
- **"Afficher les couleurs par groupe"** — color events by *type* (CM/TD/TP all share a color)
  vs. by calendar.
- **"Afficher les week-ends"** — show weekends in week view.
- **"Gérer les événements masqués"** — opens the hidden-events manager.
- **"Thème"** — Light / Dark / System (a dialog of radio options).
- **"Afficher au démarrage de l'application"** — start on Home or on Calendar (a dialog).

### Flow G — Hidden events

- **Hide** from an event's overflow menu (Flow C).
- **Unhide** from **Settings → "Gérer les événements masqués"** → **Événements masqués**: a list
  of hidden items (by name or by specific instance), each with a remove control; empty state is
  *"Aucun événement masqué"*.

### Flow H — Feedback / about

- **Profile → "Vos retours et suggestions"** → a form: a subject dropdown (*"Signaler un
  problème"* / *"Proposer une fonctionnalité"* / *"Autre"*), email, multiline message, **Send**.
- **Profile → "À propos"** → privacy policy link, app description, contact email, app
  version (tap reveals a debug screen), a **Changelog** button, developer credits.

---

## Screen-by-screen reference

A compact catalog. Each entry: what it shows, what you can do, and the Material widgets in play
(useful for spotting what becomes native).

### Root / navigation
- **Splash** — centered logo (150px), ~1s, then routes to onboarding or the tabs.
- **Tabs shell** — bottom nav (Accueil / Calendrier / Profil); FAB on Calendar only.

### Home tab
- **Home (Accueil)** — header (count of today's classes), horizontal upcoming-event cards
  (220px wide), today mini-timeline with a red "now" line, pull-to-refresh.
  *Widgets: ListView, horizontal ScrollView, custom timeline, RefreshIndicator.*

### Calendar tab
- **Calendar (Calendrier)** — month/year header, "Aujourd'hui" button, overflow menu; week
  **or** planning view; swipe weeks; tap event → details. *Widgets: custom calendar grid,
  AppBar actions, PopupMenu, FAB.*
- **User calendars (Mes calendriers)** — list with visibility checkboxes, swipe/long-press
  delete + confirm dialog, FAB to add. *Widgets: ListView, Checkbox, Dismissible, BottomSheet,
  AlertDialog, FAB.*

### Profile tab
- **Profile (Profil)** — a **pink header** ("TimeCalendar" / "Profil" + a large white person
  icon), then a list of menu rows, each padded with an icon and a bottom divider:
  *Activité, Calendriers, Paramètres, À propos, Vos retours et suggestions*. *Widgets: list of
  ListTile-like rows, unread red-dot badge.*
- **Settings (Paramètres)** — see Flow F. *Widgets: PrefPage, PrefSwitch, PrefDialogButton,
  ListTile.*
- **Activity (Activité)** — calendar-change feed (add/modify/cancel items with colored status
  icons). *Currently feature-disabled — shows an empty state.*
- **Hidden events (Événements masqués)** — see Flow G.
- **About (À propos)** — privacy link, description, contact, version (→ debug), changelog,
  credits. *Widgets: scrolling content + outline buttons.*
- **Feedback (Vos suggestions)** — subject dropdown, email, message, send. *Widgets: Form,
  DropdownButton, TextFormField, button with loading state.*
- **Changelog (Nouveautés)** — close (×), title, versioned list of new features, "Continuer".

### Event
- **Event details** — title + time, tags, content lines (location / calendar / teachers /
  description), reorderable checklist, overflow menu (hide, or edit/delete). *Widgets:
  CustomScrollView + SliverReorderableList, PopupMenu, Checkbox, inline TextField, drag handle.*
- **Add/edit personal event** — title, date picker, start/end time pickers (red end label if
  invalid), location, description, color picker dialog; Save / Close. *Widgets: Form,
  showDatePicker, showTimePicker, MaterialPicker color dialog.*

### Import / onboarding
- **Onboarding** — 3-slide carousel on a pink gradient (see Flow A). *Widgets: PageView, page
  dots, gradient.*
- **School selection** — searchable school list + "school not found?". *Widgets: SliverAppBar,
  sticky search header, list.*
- **Add school / Add grade** — single text field + "Retour / Suivant" buttons under an
  expandable `SliverAppBar`. *Widgets: SliverAppBar, TextFormField, button pair.*
- **Assistant** — embedded **web view** for the school login/import (titled *"Importer votre
  calendrier"*). *Widgets: WebView in a Scaffold + AppBar.*
- **Connect** — instructions to log into the school intranet on a computer/browser, with an
  external-link button. *Widgets: SliverAppBar, button, "Retour / Suivant".*
- **Import iCal** — scan a **QR code** or paste an **iCal URL**. *Widgets: SliverAppBar, scan
  button, URL field.*
- **QR scanner** — full-screen camera that auto-detects a QR code and returns its URL.
  *Widgets: MobileScanner camera view.*

### Utility
- **Debug** — calendar dump + a "throw exception" test button (reached by tapping the version
  on About). Internal only.

---

## What this tells the designer

- The app is **content-light per screen but flow-heavy** — the import journey is the most
  complex part and the most "assistant-like."
- The **daily-use surfaces (Home, Calendar, Event details)** are where students spend their time
  and where a great native calendar feel matters most.
- Several screens are **deeply Material today** (FAB, bottom nav, `SliverAppBar` expandable
  headers, swipe-to-delete, popup overflow menus, Material dialogs/pickers). Those are exactly
  the spots that should become platform-native — catalogued in
  [04-material-to-native.md](./04-material-to-native.md).
