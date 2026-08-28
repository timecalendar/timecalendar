# 03 — Flutter seed packs

← [02 — Persisted data inventory](./02-persisted-data-inventory.md) · [Section index](./README.md) · next: [04 — iOS in-place update](./04-ios-in-place-update.md)

> The exact data you create in the **Flutter** app before the update, and the baseline you record
> so that "did it survive?" is a comparison, not a memory test.
>
> Two packs: **`SEED-A`** (compact, every routine pass) and **`SEED-B`** (large, exposes partial
> migration, truncation, duplication, ordering and practical performance problems).

---

## 1. Conventions

**Reference dates.** `D0` is the calendar date on which you seed. `D0+1` is the next day, and so
on. Always use dates in the near future so the data is visible on the Accueil/Calendrier surfaces
without scrolling. **Write the real date for `D0` in the report header** — every expected value
below depends on it.

**Times are local device time.** Record the device timezone in the report header
([08](./08-qa-execution-report-template.md)).

**Record identifiers.** `PE-A1`, `CL-A1-2`, `HID-A1`… are *this playbook's* labels, not anything
the app shows. They exist so a scenario can say "PE-A3 must still be there".

**Type the values exactly**, including accents, emoji, punctuation and trailing/leading spaces
where specified. The point of Unicode and long-text rows is that they are byte-fragile; a
paraphrase proves nothing.

**Flutter's personal-event form constrains you** (`app/lib/modules/personal_event/widgets/add_personal_event_form.dart`,
`app/lib/modules/personal_event/states/add_personal_event_form_state.dart`):

- One **date** plus a start **time** and an end **time** — a personal event cannot span midnight.
- The end time must be **strictly after** the start time.
- There is no all-day toggle and no recurrence. (Recurring/all-day data therefore only exists as
  *school* events coming from the server — covered by `ON-01`, not by the seed pack.)

## 2. Onboarding & account states

The Flutter app has **no login** ([D-21](./02-persisted-data-inventory.md#d-21)). The states that
materially change persisted data are these three, and both packs pass through all of them.

| State | How you reach it | What it persists |
| --- | --- | --- |
| **S1 — Fresh install, never onboarded** | Install, launch, do nothing else. | Only the `shared_preferences` defaults (`loadSettings` writes every key on first run). `user_calendars` is empty, so the splash routes to onboarding (`app/lib/modules/splash/hooks/use_splash_controller.dart`). |
| **S2 — One calendar subscribed** | Complete onboarding → school → grade/group → import. | The first `user_calendars` record, including the irreplaceable `token` ([D-01](./02-persisted-data-inventory.md#d-01)). The splash now routes to the tabs. |
| **S3 — Multiple calendars, one hidden** | Add a second (and for `SEED-B`, a third) calendar from **Profil → Calendriers → +**, then turn one calendar's visibility off. | Additional `user_calendars` records + a `visible: false` flag ([D-03](./02-persisted-data-inventory.md#d-03)). |

`SEED-A` reaches **S2** and, for the visibility flag, uses the single calendar. `SEED-B` reaches
**S3**.

There is a fourth state worth naming because it changes a preference rather than a store:

| State | How you reach it | What it persists |
| --- | --- | --- |
| **S4 — Changelog seen** | Launch a version whose changelog is newer than `current_version`. On a current install this has already happened; confirm the value is at **3**. | `flutter.current_version = 3` ([D-15](./02-persisted-data-inventory.md#d-15)) — the value `OFF-11` depends on. |

---

## 3. `SEED-A` — the compact pack

**Use for:** every routine QA pass, both platforms.
**Seeding time:** 45–60 min.

### 3.1 `SEED-A-01` — Install and onboard (state S1 → S2)

1. Install the released Flutter build from the store ([01 §3.1](./01-scope-prerequisites-and-execution-order.md#31-the-source-build-flutter)).
2. Launch. Swipe through the three onboarding pages ("Bienvenue dans TimeCalendar !", "Consultez
   votre agenda", "Recevez des notifications") and tap **« C'est parti ! »**.
3. On the school list, search for and select the school your QA account uses. Follow the
   assistant to the end and confirm the import.
4. Wait for the timetable to load. You must see real courses on **Calendrier**.

**Record now — you cannot recover these later:**

| ID | Baseline value to record |
| --- | --- |
| `BASE-01` | The school name and the grade/group you picked, verbatim. |
| `BASE-02` | The calendar name shown on **Profil → Calendriers** (`Mes calendriers`), verbatim. |

> If the import fails, **stop and fix it before seeding anything else**. A pass without a
> subscribed calendar cannot verify [D-01](./02-persisted-data-inventory.md#d-01), which is the
> most important datum in the playbook.

### 3.2 `SEED-A-02` — Choose the reference courses

From **Calendrier**, pick three real courses in the next 7 days and record them. You will hide
one, and attach notes to another.

| ID | What to pick | Record |
| --- | --- | --- |
| `COURSE-1` | A course you will attach a checklist to. | Title, date, start–end time, room. |
| `COURSE-2` | A **single occurrence** you will hide by uid. | Title, date, start–end time. |
| `COURSE-3` | A course whose **title repeats** at least twice in the visible window (a weekly class). Must be a different title from `COURSE-1` and `COURSE-2`. | Title (exact, including case and accents) and **all** its occurrence dates/times in the next 14 days. |

| ID | Baseline value to record |
| --- | --- |
| `BASE-03` | `COURSE-1`, `COURSE-2`, `COURSE-3` as above, with a screenshot of the week containing them. |

### 3.3 `SEED-A-03` — Create the personal events

**Accueil → the `+` button** opens the personal-event form. Create these five, in this order.

#### `PE-A1` — the fully-populated event

| Field | Exact value |
| --- | --- |
| Titre | `Révisions Analyse 2` |
| Date | `D0` |
| Début | `10:00` |
| Fin | `12:00` |
| Lieu | `BU Sciences, salle 204` |
| Description | `Chapitres 3 et 4.`<br>`Apporter les annales 2024.` (two lines — press return between them) |
| Couleur | Open the colour picker and pick the **blue** swatch, then **Choisir**. |

#### `PE-A2` — minimal, and overlapping `PE-A1`

| Field | Exact value |
| --- | --- |
| Titre | `Sport` |
| Date | `D0` |
| Début | `10:30` |
| Fin | `11:30` |
| Lieu | *(leave empty)* |
| Description | *(leave empty)* |
| Couleur | *(do not touch — keep the default pink)* |

> This one deliberately **overlaps** `PE-A1` and leaves both optional fields empty. It covers
> "empty optional fields survive as empty, not as the string `null`" and "two overlapping personal
> events both render".

#### `PE-A3` — Unicode, emoji, and long text

| Field | Exact value |
| --- | --- |
| Titre | `Réunion assoc' 🎓 — préparation du gala de fin d'année (comité restreint)` |
| Date | `D0+1` |
| Début | `18:00` |
| Fin | `19:30` |
| Lieu | `Maison de l'étudiant · salle « Cœur d'Ampère » — bât. B, 2ᵉ étage 🏛️` |
| Description | Paste the long description below **exactly**, then verify the field kept all of it. |
| Couleur | Pick the **green** swatch. |

```
Ordre du jour : (1) budget prévisionnel et arbitrages — traiteur, sono, sécurité ; (2) répartition des rôles : accueil, billetterie, vestiaire, régie ; (3) communication — affiches, réseaux sociaux, relais auprès des associations partenaires ; (4) questions diverses. Rappel : les comptes rendus des séances précédentes sont archivés sur le drive de l'association, dossier « Gala 2026 ». Merci d'apporter vos notes personnelles ainsi que les devis reçus. Les personnes empêchées peuvent transmettre leur pouvoir par écrit avant la séance. Fin de séance prévue à 19h30 — merci d'être ponctuel·le·s. ✅
```

#### `PE-A4` — day-start boundary

| Field | Exact value |
| --- | --- |
| Titre | `Nuit blanche révisions` |
| Date | `D0+2` |
| Début | `00:00` |
| Fin | `00:45` |
| Lieu | `Chez Léa` |
| Description | *(leave empty)* |
| Couleur | *(default)* |

#### `PE-A5` — day-end boundary

| Field | Exact value |
| --- | --- |
| Titre | `Rendu projet — dépôt en ligne` |
| Date | `D0+2` |
| Début | `23:15` |
| Fin | `23:59` |
| Lieu | *(leave empty)* |
| Description | `Ne pas oublier le fichier .zip` |
| Couleur | Pick the **red** swatch. |

| ID | Baseline value to record |
| --- | --- |
| `BASE-04` | A screenshot of the **Accueil** list showing all five, plus a screenshot of each event's detail view. The screenshots are the colour reference — the exact stored hex is not visible in the UI ([D-05](./02-persisted-data-inventory.md#d-05)). |
| `BASE-05` | The count: **5 personal events**. |

> ⚠️ **Colour caveat.** If the app is in dark mode when you create an event, Flutter lightens the
> chosen colour before storing it and darkens it again for display
> ([D-05](./02-persisted-data-inventory.md#d-05)). Seed the personal events in **light** mode —
> `SEED-A-06` switches the theme to dark *afterwards* — so the stored hex is the picked hex and
> the comparison is unambiguous. Note the order in the report.

### 3.4 `SEED-A-04` — Create the checklists

#### `CL-A1` — on a personal event (`PE-A1`)

1. Open `PE-A1` from **Accueil**.
2. Tap **« Ajouter une note »** and add these three items **in this order**:

| ID | Content | Checked? |
| --- | --- | --- |
| `CL-A1-1` | `Relire le TD 5` | no |
| `CL-A1-2` | `Imprimer les annales` | **yes** |
| `CL-A1-3` | `Prévoir une calculatrice 🧮` | no |

3. Add a fourth item `À supprimer` and then **delete it**. It must not come back
   ([D-09](./02-persisted-data-inventory.md#d-09)).

#### `CL-A2` — on a school course (`COURSE-1`)

1. Open `COURSE-1` from **Calendrier**.
2. Add these two items in order:

| ID | Content | Checked? |
| --- | --- | --- |
| `CL-A2-1` | `Rapport de TP à rendre` | no |
| `CL-A2-2` | `Groupe : Léa, Ismaël, Théo` | **yes** |

| ID | Baseline value to record |
| --- | --- |
| `BASE-06` | Screenshot of `PE-A1`'s checklist showing 3 items in order with item 2 checked. |
| `BASE-07` | Screenshot of `COURSE-1`'s checklist showing 2 items in order with item 2 checked. |
| `BASE-08` | Total checklist items across the install: **5**. |

### 3.5 `SEED-A-05` — Hide events

1. Open `COURSE-2` from **Calendrier** → tap the **⋮ Menu** button in the header → **Masquer** →
   in the dialog, select the radio **« Masquer cet événement »** → tap **Masquer**.
   → this is `HID-A1` (hidden by uid, [D-10](./02-persisted-data-inventory.md#d-10)).
2. Open any occurrence of `COURSE-3` → **⋮ Menu** → **Masquer** → select the radio
   **« Masquer tous les événements de même nom »** → tap **Masquer**.
   → this is `HID-A2` (hidden by name, [D-11](./02-persisted-data-inventory.md#d-11)).
3. Go to **Paramètres → Gérer les événements masqués** and confirm both entries are listed.

| ID | Baseline value to record |
| --- | --- |
| `BASE-09` | Screenshot of the **Événements masqués** screen showing both entries. |
| `BASE-10` | Confirm on **Calendrier** that `COURSE-2`'s occurrence is gone and that **every** occurrence of `COURSE-3` is gone. Screenshot the week. |

### 3.6 `SEED-A-06` — Set the preferences

**Paramètres** (Profil → Paramètres):

| Setting | Set to | Datum |
| --- | --- | --- |
| Thème | **Sombre** | [D-14](./02-persisted-data-inventory.md#d-14) |
| Afficher les couleurs par groupe | **on** | [D-17](./02-persisted-data-inventory.md#d-17) |
| Afficher les week-ends | **off** | [D-17](./02-persisted-data-inventory.md#d-17) |
| Afficher au démarrage de l'application | **Calendrier** | [D-17](./02-persisted-data-inventory.md#d-17) |

On the **Calendrier** tab:

| Setting | Set to | Datum |
| --- | --- | --- |
| View type | **Planning** (the list view, not the week grid) | [D-16](./02-persisted-data-inventory.md#d-16) |
| Hour height | Pinch-zoom the week grid noticeably in or out, then return to Planning | [D-17](./02-persisted-data-inventory.md#d-17) |

| ID | Baseline value to record |
| --- | --- |
| `BASE-11` | Screenshot of the **Paramètres** screen showing all four positions. |
| `BASE-12` | The app is visibly in **dark** theme. |

### 3.7 `SEED-A-07` — Calendar visibility

With only one calendar, verify the control and leave it **on**:

1. **Profil → Calendriers** (`Mes calendriers`).
2. Confirm your calendar is listed and visible.

| ID | Baseline value to record |
| --- | --- |
| `BASE-13` | Screenshot of **Mes calendriers**: **1 calendar**, visible. |

### 3.8 `SEED-A-08` — Final baseline sweep

Force-quit and relaunch the Flutter app one last time. Everything above must still be there —
this proves the baseline is *persisted*, not just in memory, so a later absence is attributable to
the migration and not to a Flutter write that never landed.

| ID | Baseline value to record |
| --- | --- |
| `BASE-14` | Post-relaunch confirmation of `BASE-04`…`BASE-13`. Note the Flutter version from **Profil → À propos**. |

### 3.9 `SEED-A` at a glance

| Datum | Count |
| --- | --- |
| Calendars ([D-01](./02-persisted-data-inventory.md#d-01)–[D-03](./02-persisted-data-inventory.md#d-03)) | 1, visible |
| Personal events ([D-04](./02-persisted-data-inventory.md#d-04)) | 5 |
| Checklist items ([D-06](./02-persisted-data-inventory.md#d-06)) | 5 live (+1 deleted, must stay deleted) |
| Checklist owners ([D-07](./02-persisted-data-inventory.md#d-07)) | 2 — one personal event, one school course |
| Hidden by uid ([D-10](./02-persisted-data-inventory.md#d-10)) | 1 |
| Hidden by name ([D-11](./02-persisted-data-inventory.md#d-11)) | 1 |
| Non-default preferences | 6 |

---

## 4. `SEED-B` — the large pack

**Use for:** at least one platform per release; prefer Android, and the slower device if you have
one. **Seeding time:** 2.5–4 h of manual entry. Budget it honestly.

`SEED-B` **is a superset of `SEED-A`**: do all of `SEED-A-01`…`SEED-A-08` first, unchanged, then
add everything below. That way one pass covers both the precise value checks and the volume
checks.

### 4.1 What the volume is actually for

| Risk | How the pack exposes it |
| --- | --- |
| **Partial migration** | Sentinel records at the extremes of every ordering (first, middle, last) — if an import stops early or skips a page, a sentinel is missing and you can say *which* one. |
| **Truncation** | Exact counts are declared up front, so "58 of 60" is a finding, not a feeling. |
| **Duplication** | The naming scheme is unique per record (`PE-B-007`), so a duplicate is visible as a repeated label rather than requiring a diff. |
| **Ordering** | Checklists with 8–12 items make an off-by-one or a re-sort obvious. |
| **Practical performance** | 60 personal events + 3 calendars is enough to feel a slow first launch or a janky list. `OFF-19` measures nothing precisely — it asks "is this usable?". |

### 4.2 `SEED-B-01` — Two more calendars (state S3)

1. **Profil → Calendriers → `+`** → add a second calendar (a different school or a different
   group of the same school).
2. Repeat for a third.
3. Turn the **third** calendar's visibility **off**.

| ID | Baseline value to record |
| --- | --- |
| `BASE-B1` | The three calendar name/school pairs as an unordered set, and which named calendar is hidden. Screenshot. RN does not promise row order. |

### 4.3 `SEED-B-02` — 55 more personal events (60 total)

Create `PE-B-001` … `PE-B-055` with this deterministic scheme, so entry is mechanical and
verification is a pattern match rather than 55 individual comparisons:

| Field | Rule |
| --- | --- |
| Titre | `PE-B-001 Cours` … i.e. the literal id, a space, then a word cycling through `Cours`, `Révision`, `Projet`, `Rendez-vous`, `Sport` |
| Date | Spread across `D0` … `D0+13`: events 1–4 on `D0`, 5–8 on `D0+1`, and so on (4 per day, 14 days ≈ 56 slots) |
| Début / Fin | `08:00–09:00`, `11:00–12:00`, `14:00–15:00`, `17:00–18:00` for the four slots of each day |
| Lieu | Empty for odd ids, `Salle <id>` for even ids |
| Description | Empty for odd ids, `Note ` + the id for even ids |
| Couleur | Default for all except the three sentinels below |

**Sentinels — type these exactly instead of the scheme value:**

| ID | Override |
| --- | --- |
| `PE-B-001` | Titre `PE-B-001 ⭐ PREMIER — début de série` · colour **blue** |
| `PE-B-028` | Titre `PE-B-028 ⭐ MILIEU — Français : où ça ? « ça ! » 中文 🇫🇷` · colour **green** · Description = the same long paragraph used by `PE-A3` |
| `PE-B-055` | Titre `PE-B-055 ⭐ DERNIER — fin de série` · colour **red** · Date `D0+13`, `23:00–23:59` |

| ID | Baseline value to record |
| --- | --- |
| `BASE-B2` | **Total personal events = 60** (5 from `SEED-A` + 55). Screenshot of the top and the bottom of **Mes événements** showing `PE-A*` and the three sentinels. |

### 4.4 `SEED-B-03` — 120 more checklist items

Pick **12** of the `PE-B-*` events — `PE-B-001`, `PE-B-005`, `PE-B-010`, `PE-B-015`, `PE-B-020`,
`PE-B-025`, `PE-B-028`, `PE-B-030`, `PE-B-035`, `PE-B-040`, `PE-B-050`, `PE-B-055` — and give each
**10** items:

| Item # | Content | Checked? |
| --- | --- | --- |
| 1 | `<event id> item 01 — PREMIER` | no |
| 2…9 | `<event id> item 0N` | **even N checked**, odd N unchecked |
| 10 | `<event id> item 10 — DERNIER` | no |

Then pick **3 more school courses** (`COURSE-4`, `COURSE-5`, `COURSE-6`; record them) and give
each 3 items following the same naming, so the pack has checklists on both event kinds at volume.

| ID | Baseline value to record |
| --- | --- |
| `BASE-B3` | **Total checklist items = 134** (5 from `SEED-A` + 120 + 9). The per-event counts. Screenshots of the first, middle and last of the 12 lists. |

> The `— PREMIER` / `— DERNIER` suffixes are what make an ordering regression visible at a glance:
> if item 10 renders first, ordering broke.

### 4.5 `SEED-B-04` — 25 more hidden entries

1. Hide **20 individual course occurrences** by uid, spread across all three calendars and across
   at least 5 different days. Record each one's title + date/time as you go.
2. Hide **5 more course titles** by name. Record the titles exactly.

| ID | Baseline value to record |
| --- | --- |
| `BASE-B4` | **Hidden by uid = 21** (1 from `SEED-A` + 20). **Hidden by name = 6** (1 + 5). The full list, in the order the **Événements masqués** screen shows them. Screenshot the whole screen, scrolling. |

### 4.6 `SEED-B` at a glance

| Datum | Count |
| --- | --- |
| Calendars | 3 (one hidden) |
| Personal events | 60 |
| Checklist items | 134, across 17 owning events (2 from `SEED-A` + 15 from `SEED-B`: 12 personal + 3 courses) |
| Hidden by uid | 21 |
| Hidden by name | 6 |
| Non-default preferences | 6 |

---

## 5. The baseline record sheet

Copy this into the report ([08](./08-qa-execution-report-template.md)) and fill it in **before**
cutting the network. An empty baseline row makes every scenario that depends on it
unreportable — you will have nothing to compare against.

| ID | Baseline | Pack | Value / evidence |
| --- | --- | --- | --- |
| `BASE-01` | School + grade/group picked | A, B | |
| `BASE-02` | Calendar name as shown | A, B | |
| `BASE-03` | `COURSE-1`, `COURSE-2`, `COURSE-3` details + week screenshot | A, B | |
| `BASE-04` | The 5 `PE-A*` events — list + per-event detail screenshots | A, B | |
| `BASE-05` | Personal-event count = 5 | A | |
| `BASE-06` | `PE-A1` checklist — 3 items, order, item 2 checked | A, B | |
| `BASE-07` | `COURSE-1` checklist — 2 items, order, item 2 checked | A, B | |
| `BASE-08` | Checklist item count = 5 | A | |
| `BASE-09` | Hidden-events screen showing both entries | A, B | |
| `BASE-10` | `COURSE-2` occurrence + all `COURSE-3` occurrences absent from the calendar | A, B | |
| `BASE-11` | Paramètres screenshot — the four positions | A, B | |
| `BASE-12` | App visibly in dark theme | A, B | |
| `BASE-13` | Mes calendriers — 1 calendar, visible | A | |
| `BASE-14` | Post-relaunch confirmation + Flutter version from À propos | A, B | |
| `BASE-B1` | 3 calendar name/school pairs (unordered set), which is hidden | B | |
| `BASE-B2` | Personal-event count = 60 + sentinel screenshots | B | |
| `BASE-B3` | Checklist item count = 134 + per-event counts | B | |
| `BASE-B4` | Hidden by uid = 21, by name = 6, full list in screen order | B | |

---

← [02 — Persisted data inventory](./02-persisted-data-inventory.md) · [Section index](./README.md) · next: [04 — iOS in-place update](./04-ios-in-place-update.md)
