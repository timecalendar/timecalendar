# Calendar naming, bedtime edition 🐵🌙

**Paperclip:** [TIM-274](https://paperclip.lyrolab.fr/TIM/issues/TIM-274)  
**Serious spec:** [calendar-naming-and-manual-import.md](./calendar-naming-and-manual-import.md)  
**Status:** Decisions made. Tickets not created yet.

## 🎯 The whole story

A student picks their school.

They name their formation.

We help them open the school intranet.

Then they scan a QR code or paste an iCal link.

```text
School -> Formation -> Connect -> QR or iCal link
                              |
                              +-- assistant comes here later
```

The formation becomes the calendar name.

The assistant is for another project.

Flutter is left completely alone.

## 🏫 We collect school AND formation

They answer two different questions:

- **School:** Who gives you this calendar?
- **Formation:** Which course is this calendar for?

If the school is in our list, we already know its name. We send its `schoolId`.

If the school is missing, we ask the student to type its name. We trim it, allow up to 100
characters, and send `schoolName`.

We never send both.

Then we ask:

- French: **Nom de formation**
- English: **Programme name**
- Example: **L3 Informatique**

This makes sense for double degrees, masters, engineering schools, Group A, Group A2, and students
with two or three calendars.

After onboarding, we simply call it the **calendar name**.

## ✏️ The name can be empty

The student can type a name or use **Skip**.

Skip is a quiet, native action in the top-right header. It is not a second giant button. It has the
normal iOS/Android look, touch size, translation, and screen-reader label.

Name rules:

- Trim spaces at both ends
- Accents, Unicode, and emoji are fine
- Maximum 100 characters
- Empty is fine
- The placeholder is never secretly saved

An empty or whitespace-only name displays as:

- **Mon emploi du temps**
- **My timetable**

We do not clean old production rows. Many are empty, whitespace, strange URLs, or very long. The app
just displays them safely.

## 🧳 The temporary import bag

During onboarding, RN keeps one tiny in-memory bag:

- Listed school, or typed school name
- Formation name

It survives Back and failed imports.

It disappears after success, after leaving the journey, or after an app restart.

It does not live in MMKV. This stops an old saved school from leaking into a new import.

If a direct link opens QR or URL import without the bag, importing still works with empty school and
calendar names.

## 🔗 Connect, then import

The Connect screen says: open your school intranet and find your timetable.

If the school has a safe HTTP(S) intranet link, we show it.

If not, we show the instructions without a link.

Continue goes to one manual-import screen with two choices:

- Scan QR code
- Paste iCal link

That screen reuses the existing RN QR and URL flows. It does not rebuild their camera, validation,
loading, or error code.

The unused group picker leaves normal onboarding. Its code can stay for now. No production school
uses groups.

Later, the assistant can sit between Connect and import. We leave the door open, but we do not build
the room. 🚪

## 📮 Calendar creation stays old-client friendly

The existing route stays:

```http
POST /calendars
```

RN sends:

```text
Listed school:   url + schoolId + name
Unlisted school: url + schoolName + name
```

Old clients may omit `name`. The server turns that into `""` before saving.

No database migration. No backfill. No Flutter changes.

OpenAPI is updated, but only the RN client is regenerated.

## 🏷️ Rename

Every calendar has the same `⋮` menu on iOS and Android:

- Rename
- Delete

Android loses the lonely trash button.

Rename uses one app-styled popup on both platforms. It can stay open while saving, show an error,
and retry without losing the typed name.

The server call is:

```http
PATCH /v1/calendars/:token
Content-Type: application/json

{ "name": "L3 Informatique" }
```

The server trims the name, accepts empty, rejects more than 100 characters, returns the updated
calendar, and returns 404 for a bad token.

Rename may update normal database metadata. It never changes `lastUpdatedAt`, because that means
“when did we last fetch the actual timetable?”

Duplicate names are fine. Last rename wins.

## 🔑 The token is the key

There is no calendar owner account.

Anyone holding the token can rename the calendar for everyone holding that token.

So this is a shared name, not a private phone nickname.

We are not adding ownership, permissions, token rotation, per-phone aliases, or rename history.

## 🔄 How devices agree

Normal sync already returns calendar information with the events. RN currently ignores the name.

It will now update only the local name.

It must not replace the whole local calendar row. Doing that could reset phone-only settings and
make a hidden calendar visible again. 🙈

Events update first. The name updates second.

If the name write fails, the next sync repairs it. That small delay is accepted.

## 🛟 Support gets the formation

When an RN import fails and the student contacts support, RN may send:

```text
calendarName
```

This helps support notice several failures from the same formation.

Flutter keeps its old `gradeName` field. Crisp receives both fields separately. Nothing is renamed
or removed.

The information is sent only when the student chooses to contact support.

## 🧱 Why only this route says `/v1`

The new rename route is `/v1/calendars/:token`.

The old routes stay unversioned so old clients keep working.

We are not turning on global NestJS versioning or moving the rest of the API. It is slightly untidy,
but deliberate.

## 📦 In and out

✅ RN school + formation flow  
✅ Missing-school text input  
✅ Connect screen and intranet link  
✅ QR and iCal choices  
✅ Real create metadata  
✅ Empty-name fallback  
✅ Server rename  
✅ RN rename UI  
✅ Name refresh during sync  
✅ Formation context for support  
✅ Tests and documentation

❌ Flutter changes  
❌ Assistant  
❌ School groups  
❌ Production backfill  
❌ Duplicate warnings  
❌ Accounts or ownership  
❌ Private aliases  
❌ Rename history  
❌ Whole-API `/v1` migration

## ⚠️ Risks we knowingly accept

- Anyone with the token can rename for everyone.
- Old weird names stay weird in storage, but display safely.
- `/v1` looks different from the old routes.
- Events and the name may briefly update at different times.
- An unlisted school usually has no intranet-link button.
- Camera permission may fail, so pasting a link remains available.

## 🧪 What proves it works

Server tests cover create, empty/long names, rename, bad tokens, support fields, and old Flutter-style
requests.

RN tests both school paths, Skip, retry state, Connect, QR/link choices, request data, fallback names,
rename failures, and sync without losing local visibility.

A real app test renames a dedicated calendar, restarts, syncs, and checks the name.

Humans check iOS and Android menus, Skip, large text, VoiceOver/TalkBack, intranet links, errors, and
camera permission.

## 🎟️ Four tickets later, not tonight

**1. Server contract**

Safe create names, rename API, support field, OpenAPI, RN client.

**2. RN onboarding**

School → Formation → Connect → QR or link.

**3. RN rename and sync**

Menu, popup, server call, local update, shared-name convergence.

**4. Serious documentation**

Fix OpenSpec, roadmap, and architecture notes that still describe stale group/navigation behavior.

Ticket 1 comes first. Tickets 2 and 3 follow. Ticket 4 can run beside them and closes last.

No Paperclip ticket has been created yet.

👉 Next action: approve the ticket bodies, then issue the four tickets.
