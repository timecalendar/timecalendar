# 1 — Product overview

## What TimeCalendar is

TimeCalendar is a mobile calendar app for **university students in France**. Most French
universities publish each student's class timetable through an online scheduling system (often
an iCal feed or a school portal). Those systems are clunky, and the raw calendars are ugly and
hard to read on a phone. TimeCalendar's job is to **import that timetable once and turn it into
a beautiful, fast, glanceable calendar** the student actually wants to open every morning.

On top of the imported schedule, students can:

- See **today and what's next** at a glance.
- Browse their **week** or an **agenda/planning** list.
- Tap a class to see **details** (room, teacher, type, description).
- Add their own **personal events** (a dentist appointment, a study session).
- Attach a **checklist** to any event ("bring the lab coat", "print the handout").
- **Hide** classes they don't care about (a cancelled lecture, an optional section).
- Manage **multiple calendars** (e.g. a main timetable + a club calendar) and toggle each on/off.

## Who uses it

- **Primary user:** a French university student, 18–25, on a phone (iPhone or Android),
  checking their schedule multiple times a day — between classes, in the morning, the night
  before. Quick, glanceable, low-friction use is everything.
- **Language:** the app ships **French-first**, with English as a secondary language. Copy you
  see quoted in these docs is the real French UI text.
- **Context of use:** on the move, often one-handed, often in a hurry. The "what's my next class
  and which room" question must be answerable in under two seconds.

## The "vibe" we want to keep

TimeCalendar has a distinct personality that students like. Whatever the new native designs look
like, they should still feel like *this* app:

- **Friendly and approachable**, not corporate or enterprise. It's a student tool, not an
  Outlook clone.
- **Pink is the brand.** The signature color is a vivid pink (think `#E91E63`). It shows up on
  the primary actions, the header, the active states. It's cheerful and instantly recognizable.
  See [the design system](./03-design-system.md) for the exact values.
- **Simple and uncluttered.** The core surfaces (home, calendar) are calm and content-first.
  Events are colored cards on a clean background. There's a lot of white space.
- **Rounded and soft.** Cards, buttons, and event tiles use generous rounded corners (~15px
  today) and soft shadows rather than hard borders. Nothing feels sharp or boxy.
- **Glanceable.** The home screen answers "what's happening now / next" without scrolling. The
  calendar uses color to let you parse a busy week at a glance.

## The brand essence in one sentence

> A cheerful, pink, dead-simple timetable app that makes a messy university schedule feel
> calm and yours.

## What the redesign is *not*

- Not a rebrand. Pink stays. The name, logo, and personality stay.
- Not a feature change. We're keeping the same features (see
  [screens & flows](./02-screens-and-flows.md)). This is a *visual/interaction* redesign.
- Not a "make it look like Material on both platforms" project. The opposite — see
  [the core challenge](./04-material-to-native.md).
