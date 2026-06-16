# 3 — Current design system

This is TimeCalendar's visual system **as it exists today** in the Flutter app. Treat it as the
*starting point and brand reference*, not a spec to reproduce. The brand DNA (pink, Poppins,
rounded, soft shadows) is what we want to carry forward; the exact Material tokens are what
you'll re-interpret per platform.

All hex values below are taken from the live app.

---

## Color

### Brand

| Role | Value | Where it's used |
| --- | --- | --- |
| **Primary pink** | `#E91E63` | Header/app bar, FAB, primary buttons, active states, the "now" accent, links |
| Primary light | `#FCE4EC` (pink 100) | Light highlight fills, unread badge backgrounds |
| Primary dark | `#AD1457` (pink 700) | Darker accent / pressed states |
| Accent | `#FF4081` (pink accent) | Secondary accent, selected bottom-nav item |

> **Pink is the single defining color.** It currently floods large surfaces (the whole app bar
> and profile header are solid pink). A native redesign may use pink more sparingly as an
> *accent* (especially on iOS, where large solid-color nav bars are unusual) — but it must stay
> the unmistakable brand color.

### Neutrals (light theme)

| Role | Value |
| --- | --- |
| Background | `#FAFAFA` |
| Card / surface | `#FFFFFF` |
| Line / divider | `#EEEEEE` |

### Neutrals (dark theme)

| Role | Value |
| --- | --- |
| Background | `#303030` |
| Card / surface | `#3F3F3F` |
| Line / divider | `#3A3A3A` |

> The app fully supports **light and dark mode** (and "follow system"). Both must be designed.

### Onboarding gradient

A warm pink vertical gradient used only on the onboarding carousel: **`#F76262 → #E66B9A`**
(top → bottom).

### Event & status colors

- **Event colors are data, not theme.** Each calendar (and each class type) carries its own
  color, shown as the event card's fill/accent. A busy week is a mosaic of colors — this is
  intentional and central to glanceability. In **dark mode**, event colors are **darkened ~28%**
  so they sit calmly on the dark background (and lightened ~28% in the inverse case).
- **"Now" indicator:** a thin line at the current time, pink-red **`#FF91B1`**.
- **Activity feed status colors** (the activity feature, currently disabled):
  - New class — bg `#CCFFBD`, icon `#5AE630`
  - Cancelled — bg `#FFCCD9`, icon `#FF385D`
  - Modified — bg `#C7E6FF`, icon `#43A7F7`

---

## Typography

- **Typeface:** **Poppins** (a geometric, rounded, friendly sans-serif) across the whole app,
  in all nine weights (100–900). It's a big part of the soft, approachable feel.

> **Designer note:** Poppins is a deliberate brand choice. Native platforms default to **SF Pro
> (iOS)** and **Roboto (Android)**. We're open to either keeping Poppins as a brand typeface or
> moving to platform system fonts — please weigh in. If Poppins stays, it should be used
> consistently; if it goes, the friendly tone needs to survive in the platform font.

### Type scale (current, approximate)

| Level | Size | Weight | Used for |
| --- | --- | --- | --- |
| Display / hero | 26px | 600 | Home "TimeCalendar" header, onboarding titles, screen titles ("Nouveautés") |
| Title | 24–25px | 500–600 | Event title, profile header |
| Subtitle | 18–20px | 500 | Event card titles, profile menu rows, school names |
| Body | 16px | 400–500 | Descriptions, list subtitles |
| Body small | 14–15px | 400–500 | Event detail lines, time ranges |
| Caption | 12–13px | 400 | Labels, hints, metadata |
| Micro | 9–10px | 400 | Tiny indicators |

---

## Shape, spacing & elevation

- **Corner radius:** the app is consistently **rounded**.
  - `15px` — the standard radius for cards, event tiles, search bars, tags.
  - `25px` — primary buttons (pill-ish).
  - `5px` — small color dots / indicators.
- **Elevation = soft shadows, not Material elevation.** Cards use a **soft drop shadow**
  (offset `0,3`, blur `15`, `rgba(0,0,0,0.06)`) on a light surface — gentle, not heavy. The
  search bar and school cards use slightly stronger shadows.
- **Spacing** is generous and roughly on a 5px rhythm. Common values: section gaps 25–40px,
  horizontal padding 15–32px, list-row padding 20–25px, small gaps 8–15px.
- **Dividers:** 1px lines in the theme's line color, with ~8px breathing room.

> Net effect: clean, airy, rounded, soft. Keep that feeling.

---

## Components inventory (the current design-system parts)

Reusable building blocks in the app today:

- **Custom button** — filled or outline, `25px` radius, optional leading icon and loading
  spinner. Filled = pink. (Primary CTA across the app.)
- **Search bar** — rounded field with a soft shadow and a placeholder. (School search.)
- **Divider** — padded 1px line.
- **Event card (horizontal, Home)** — 220px-wide card: time, title (max 3 lines), location with
  icon, a small checklist dot (filled when the checklist is complete).
- **Event tile (calendar grid)** — a colored, rounded block positioned by time; on the
  planning view, a card with a left color accent and a current-time indicator.
- **Event details title / tag / content row** — title + color swatch, tag pills (`15px`),
  icon+label content lines.
- **Profile menu row** — padded row: title (left) + icon (right) + bottom divider; optional
  unread red dot.
- **School row** — card with a 100×100 logo, name, soft shadow.
- **Calendar list row** — visibility checkbox + name + subtitle, swipe/long-press to delete.
- **Activity row** — a colored circular status icon + change description (feature disabled).

These map roughly to: button, input, list row, card, chip/tag, checkbox, color swatch — the
component set a native design system would re-express with native controls.

---

## Iconography

- The app mixes **Material Icons** (Flutter built-in) and **Font Awesome** glyphs.
- Common icons: house/home, calendar, person/user, gear (settings), plus (add), pencil (edit),
  trash (delete), location pin, graduation cap (school/teacher), eye-slash (hide), magnifying
  glass (search), paper plane (send), info, clock, external-link, close/×, chevrons.
- Icon sizes range ~12px (inline) to ~24px+ (hero); list/menu icons are ~20px.

> **Designer note:** iconography should move to **platform-native icon sets** — **SF Symbols on
> iOS**, **Material Symbols on Android** — rather than a custom Font Awesome mix. This keeps each
> platform's controls feeling native (and gives us weight/optical-size matching for free).

---

## Assets & branding

- **Logo:** `logo.png` — used on the splash (150px, centered) and as the app launcher icon
  source. We can share the source files.
- **Onboarding illustrations:** `home.png`, `notifications.png`, `schools.png` (and a
  `school.png` placeholder) — the three carousel graphics.
- **Fonts:** the full Poppins family (`assets/fonts/Poppins-*.otf`, weights 100–900).
- **App icon / splash:** generated from the logo; the splash is a simple centered logo (the
  native OS splash, then a brief in-app logo screen).

> These are the existing brand assets. New illustrations / iconography / an updated app icon may
> be part of your deliverables — see [05-what-we-need-from-you.md](./05-what-we-need-from-you.md).

---

## Localization

- The app is **French-first**, English secondary. All visible copy is translated; date/time
  formatting follows the locale (24-hour times like `14:30`, French weekday/month names).
- Designs should account for **French string lengths** (often longer than English) and 24-hour
  time.
