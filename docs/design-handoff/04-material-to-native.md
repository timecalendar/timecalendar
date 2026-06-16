# 4 — The core challenge: Material → native

This is the heart of the brief. **Today's app is built with Flutter + Material Design**, so it
looks like a Google Material app on *both* iOS and Android. We want to rebuild it with
**platform-native patterns**: a real iOS app on iPhone, a real Material 3 app on Android. The two
platforms should look *different from each other* — each at home on its OS — while both stay
unmistakably TimeCalendar.

> **Guiding principle:** *the platform is the design reference, not the old Flutter app.* Where
> iOS and Android idioms genuinely differ, we design two layouts. We are explicitly **not**
> settling for one shared lowest-common-denominator look.

## Why it looks the way it does today

Flutter renders its own widgets, and TimeCalendar uses Material widgets throughout. So every
screen carries Material's signatures: solid-color app bars, a bottom navigation bar, floating
action buttons, Material dialogs and pickers, swipe-to-delete, popup overflow menus, expandable
"sliver" headers. On an iPhone, this reads as "an Android app running on iOS." That's the gap to
close.

## Keep vs. re-interpret

**Keep (the brand & product):** pink as the signature color, the rounded/soft feel, Poppins'
friendliness (or its spirit), the simple glanceable layouts, the feature set, French-first copy,
light + dark mode.

**Re-interpret (per platform):** navigation chrome, controls, dialogs, pickers, gestures,
typography defaults, iconography, and how aggressively pink fills large surfaces.

## The Material → native map

The table below lists the Material patterns in the app today and the native direction for each.
This is a guide, not a mandate — use your judgment; flag where you'd diverge.

| Where it is | Material today | iOS native direction | Android (Material 3) direction |
| --- | --- | --- | --- |
| **Main navigation** | Bottom `BottomNavigationBar`, 3 tabs | Native **UITabBar** (bottom), SF Symbol icons; consider a Liquid-Glass-style bar on iOS 26+ | **Material 3 navigation bar**, Material Symbols |
| **Screen header** | Solid **pink AppBar** with white title/icons | **Large title** navigation bar (often white/system bg with a pink accent), back-swipe | **M3 top app bar**, color per M3 roles |
| **Add personal event** | **FAB** ("+") on Calendar tab | A **nav-bar "+" button** (top-right), or a contextual add; FABs aren't an iOS idiom | **M3 FAB** (keep — it's native here) |
| **Overflow actions** (hide / edit / delete) | Popup `⋯` menu | **Context menu** / action sheet; or swipe actions on rows | **M3 menu** or bottom sheet |
| **Destructive (delete calendar)** | Swipe-to-delete + `AlertDialog` | **Swipe actions** (trailing red) + confirmation **action sheet** | **M3 swipe / dialog** |
| **Pickers** (date, time, color) | Material `showDatePicker` / `showTimePicker` / Material color picker | iOS **wheel/inline date & time pickers**; a native color surface | **M3 date/time pickers** |
| **Onboarding** | `PageView` carousel on a pink gradient | A native multi-page intro (page control), or full-bleed slides | M3-styled intro |
| **Multi-step import (assistant)** | Expandable `SliverAppBar` + "Retour / Suivant" pairs | A native **navigation stack** with system back + a clear primary action | M3 stepper / nav |
| **Settings** | Material `PrefPage` switches & dialog buttons | **Grouped inset list** (iOS Settings style) with native toggles & disclosure rows | **M3 settings list** with native switches |
| **Lists & rows** | `ListTile`, dividers | iOS inset grouped lists | M3 list items |
| **Toasts** | `SnackBar` | Subtle inline status / native banner (no Material snackbar) | **M3 snackbar** (keep) |
| **Tabs/segments** (week vs. planning) | implicit (a setting today) | iOS **segmented control** | **M3 tabs / segmented buttons** |
| **Icons** | Material + Font Awesome mix | **SF Symbols** | **Material Symbols** |

## Special attention: the calendar surface

The **week/agenda calendar is the heart of the app and its hardest design surface**. It's a
custom-rendered grid, not a stock Material widget, so it's the *least* tied to Material — which
means you have the most freedom here. Things to think about:

- **Density vs. readability** on a phone: a 5–7 day week with many overlapping classes is a lot
  of information. How do overlapping events stack/columnize legibly?
- **Color as the primary parsing tool** — events are colored by calendar or by type. Keep color
  central; make sure it works in dark mode (colors are auto-darkened today).
- **The "now" line** and "what's next" emphasis.
- **Day vs. week vs. agenda/planning** — how the user switches, and which is the default.
- **Tap target & glance** — opening an event's details from a small colored block.

This is a brand surface, not native chrome — so it should *feel* TimeCalendar (pink accents,
rounded tiles, soft shadows) while reading naturally on each platform.

## How pink should behave natively

Today pink fills entire app bars and the profile header. On iOS, large solid-color nav bars feel
non-native; the convention is a light/system background with **pink as an accent** (buttons,
active tab, links, selection). On Android M3, pink maps to the primary color role and can tint
more surface. We're not prescriptive — but please consider **dialing pink from "background fill"
toward "accent,"** especially on iOS, without losing brand recognition.

## Constraints to design within

- **Platforms:** iOS and Android only (no web, no tablet-specific layouts required — phone-first;
  graceful on larger phones is enough).
- **Minimum OS:** roughly **iOS 16.4+** and **Android 7+ (API 24)**. iOS 26's "Liquid Glass"
  styling is available on the newest devices with a **non-glass fallback** below it — so any
  glass treatment must degrade gracefully.
- **Light & dark mode** are both required, plus "follow system."
- **French-first**, 24-hour time, longer strings than English.
- **Accessibility matters:** legible type that respects Dynamic Type / font scaling, adequate
  touch targets (44pt iOS / 48dp Android), sufficient color contrast, and screen-reader-friendly
  structure. Please design with these in mind (e.g. don't rely on color alone).

## What "good" looks like for this project

A student picks up an iPhone and it feels like a native iOS calendar app. A different student
picks up a Pixel and it feels like a polished Material 3 app. **Both** instantly feel like
TimeCalendar — pink, friendly, calm, glanceable — and neither feels like a port of the other.
