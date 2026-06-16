# TimeCalendar — Design Handoff

Welcome, and thank you for joining the TimeCalendar redesign.

This folder is a **briefing pack for the designer**. It describes the app we have today
(built in Flutter, using Google's Material Design), the screens and flows it contains, its
current visual identity, and — most importantly — **the design challenge we're hiring you to
solve**: re-imagining the app with *native* iOS and Android patterns instead of the
one-size-fits-all Material look it has now.

You do **not** need to read any code, and you don't need to know Flutter or React Native.
These documents are written in plain product/design language. Where we mention a technology,
it's only to explain *why* something looks the way it does today.

## TL;DR — the assignment

> TimeCalendar is a calendar app for French university students. It pulls a student's class
> timetable from their school and shows it as a clean calendar, alongside personal events and
> per-event checklists. It works today, but it looks like a generic Material app on **both**
> iOS and Android. We are rebuilding it from scratch and want a redesign that feels **native
> and at home on each platform** — a real iOS app on iPhone, a real Material 3 app on Android —
> while keeping TimeCalendar's friendly, pink, student-focused personality. We want you to
> design that.

## How to read this pack (in order)

| # | Document | What it covers |
| --- | --- | --- |
| 1 | [`01-product-overview.md`](./01-product-overview.md) | What TimeCalendar is, who uses it, the "vibe" to keep. |
| 2 | [`02-screens-and-flows.md`](./02-screens-and-flows.md) | Every screen, and the end-to-end user journeys, in detail. |
| 3 | [`03-design-system.md`](./03-design-system.md) | The current visual system — colors, type, spacing, components, icons, assets. |
| 4 | [`04-material-to-native.md`](./04-material-to-native.md) | **The core challenge.** Where Material patterns live today and what native iOS/Android patterns replace them. |
| 5 | [`05-what-we-need-from-you.md`](./05-what-we-need-from-you.md) | The deliverables we're asking for, constraints, and open questions. |

## A note on what's changing vs. what's staying

- **Staying:** the product, the feature set, the brand personality (pink, friendly, simple),
  the French-student focus, the core flows (import a timetable → see your week → annotate it).
- **Changing:** the *visual language*. Today the app uses Flutter + Material Design and looks
  almost identical on iOS and Android. We are deliberately moving to **platform-native
  patterns** — which means the two platforms will, and should, look different from each other.

> Our guiding principle for the rebuild is: **the platform is the design reference, not the old
> Flutter app.** Users will see visual change — that's the upgrade, by design. Your job is to
> make each platform feel native while still unmistakably TimeCalendar.

## Context on the bigger project

This redesign rides alongside an engineering migration from Flutter to React Native (Expo). You
don't need the engineering details, but if you're curious about the overall direction, the
technical plan lives in
[`../react-native-migration/00-exploration/migration-approach.md`](../react-native-migration/00-exploration/migration-approach.md).
The one line that matters for you is in there too: *the platform is the design reference.*
