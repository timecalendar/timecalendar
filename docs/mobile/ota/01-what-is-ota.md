# 1 — What OTA actually is

*Start here. No prior knowledge assumed.*

---

## 1.1 The problem OTA solves

Today, if we find a bug in a shipped mobile app, this is what happens:

1. We fix the code. *(minutes)*
2. We build a new binary and upload it to Apple and Google. *(~30 minutes)*
3. **Apple reviews it.** Typically 24 hours, sometimes 3 days, occasionally a week if a human
   reviewer has a question. Google is usually faster but can also take days.
4. The store publishes it.
5. **Users install it.** Auto-update is on for most people, but it fires opportunistically —
   overnight, on Wi-Fi, when charging. Realistically **50% of users have the fix within 2–3
   days and 90% within two weeks.** Some never update.

So the honest end-to-end latency of a store fix is: **1–3 days before the first user can get
it, ~1 week before most users have it.**

For a university timetable app, that window has teeth. If we break the calendar on the Monday
of the first week of term, "sorry, Apple is reviewing it" is not an answer a student accepts.
They uninstall.

**OTA collapses that to hours.** Fix, publish, and users have it on their next app launch —
typically within a day, with no store involvement at all.

---

## 1.2 Why it's even possible: the two halves of our app

This is the one technical idea you need, and it's genuinely simple.

A React Native app is **two separable things** in one install:

```
┌─────────────────────────────────────────────────────────┐
│  THE NATIVE SHELL                                       │
│  Compiled Swift/Kotlin. The camera driver, the SQLite   │
│  engine, the push-notification plumbing, the app icon,  │
│  the permission prompts.                                │
│  → Apple and Google review THIS.                        │
│  → Changing it requires a new store release. Always.    │
│                                                         │
│   ┌───────────────────────────────────────────────┐     │
│   │  THE JAVASCRIPT BUNDLE                        │     │
│   │  Every screen. Every button. All the logic.   │     │
│   │  All the text. The layout, the colours, the   │     │
│   │  network calls, the date maths, the bug.      │     │
│   │  → This is ~95% of what we write day to day.  │     │
│   │  → It's just a file. It can be replaced.      │     │
│   └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

The native shell, on every launch, asks a server: *"is there a newer JavaScript bundle for
me?"* If yes, it downloads it and uses it from then on. That's the whole mechanism. There is
no magic and no trickery — it's a file download.

**The analogy:** the native shell is a games console; the JavaScript bundle is the game
cartridge. OTA ships a new cartridge. It cannot ship a new console.

---

## 1.3 What we CAN and CANNOT push over the air

This distinction is the single most important operational fact in this pack.

| ✅ Shippable over the air (hours) | ❌ Requires a store release (days) |
| --- | --- |
| Any bug in our own screens or logic | Upgrading Expo or React Native itself |
| New screens, new features, redesigns | Adding a new native library (a new map SDK, a widget) |
| Text, translations, wording fixes | New OS permissions (location, contacts) |
| Colours, spacing, layout, icons *inside* the app | The app icon, app name, splash screen |
| API endpoint changes, new server fields | Changing the minimum supported iOS/Android version |
| Timezone/date-handling fixes | Anything in `app.config.ts`'s native section |
| Turning a broken feature off | The store listing, screenshots, price |

Applied to our actual codebase: nearly every issue we have shipped this year — the display-
timezone preference, the hidden-events filter, the calendar rendering fixes, the notification
copy — would have been OTA-shippable. The FCM push integration and the camera/QR scanner
would **not** have been: both added native libraries.

Rule of thumb: **if the fix is in `mobile/src/`, it's almost certainly OTA-able. If it touches
`mobile/app.config.ts`'s plugin list or adds a dependency with native code, it's not.**

---

## 1.4 The one way this can go badly wrong — and how we're already protected

Here's the failure mode that scares people about OTA.

Suppose we add a native library — say a new barcode scanner — and ship it to the store as
version 3.1. Then we push a JavaScript OTA update that calls that new scanner. If that OTA
lands on a phone still running **3.0**, whose native shell has no scanner in it, the JavaScript
calls into something that doesn't exist and **the app crashes on launch. Every launch. For
that user, the app is dead** — and they can't be fixed by another OTA if they can't even get
to the update check.

That's how you brick a fleet of phones. It is the reason OTA has a reputation.

**We are already protected from this, by construction.** In `mobile/app.config.ts`:

```ts
runtimeVersion: { policy: "fingerprint" },
```

This tells the tooling to compute a **fingerprint** — a hash of everything native in the app.
Every OTA update is stamped with the fingerprint it was built against, and a phone will only
accept an update whose fingerprint matches its own native shell. Add a native library and the
fingerprint changes, so those updates simply **stop being delivered to older builds** instead
of crashing them. The incompatible-OTA scenario becomes impossible rather than merely
unlikely.

The practical consequence, which the team already documents in the Architecture Book: **an OTA
that "mysteriously doesn't reach anyone" is almost always correct behaviour** — it means the
change touched native code and needs a store release. That's the safety net doing its job,
not a bug.

There is a second, independent safety net: if a JavaScript bundle does somehow crash the app
at startup, `expo-updates` detects the repeated failure and **automatically falls back to the
bundle that shipped inside the store binary** — the last known-good version. Users land back
on working software without our involvement.

---

## 1.5 Is this allowed by Apple and Google?

**Yes.** This is the question everyone asks, so here it is precisely.

**Apple.** The Developer Program License Agreement (section 3.3.1(B), formerly the famous
guideline 3.3.2) explicitly permits an app to download interpreted code, provided it:

- **(a)** doesn't change the app's primary purpose into something inconsistent with what was
  reviewed and advertised;
- **(b)** doesn't create a store or storefront for other code or apps;
- **(c)** doesn't bypass code signing, the sandbox, or other OS security features.

We are shipping bug fixes and features to a university timetable app. All three conditions are
met with room to spare. The rule exists to stop apps that pass review as a calculator and then
turn into a casino — not to stop routine maintenance.

**Google Play.** Play's "Device and Network Abuse" policy allows apps to load interpreted
code, as long as the resulting behaviour still complies with Play policy. Same substance,
same conclusion.

**Evidence from practice:** Microsoft ran CodePush publicly for a decade, Expo runs EAS Update
for tens of thousands of apps, and Ionic/Capacitor apps do the same. This is a mainstream,
openly documented practice, not a loophole.

**The one real constraint to respect:** don't use OTA to sneak past review something a
reviewer rejected, and don't materially change what the app *is* between reviews. Both are
easy for us to honour, and both are written into the runbook in
[document 5](./05-runbook.md).

---

## 1.6 How an update actually reaches a phone

The concrete sequence, so the vocabulary in the rest of this pack makes sense:

1. **We publish.** One command (`eas update --channel production`) compiles the JavaScript
   bundle, uploads it, and points a *branch* at it.
2. **A phone launches.** The native shell asks the update server: *"I'm on channel
   `production`, my native fingerprint is `abc123`, what have you got?"*
3. **The server answers** with a small JSON *manifest* — or "nothing new for you". If our
   change touched native code, the fingerprint won't match and the answer is "nothing new".
4. **The phone downloads** the new bundle in the background. Thanks to *bundle diffing* —
   enabled by default in Expo SDK 56, which we're on — it usually downloads only the
   *difference* from what it has, roughly **75% smaller** than a full bundle. That matters for
   students on patchy 4G, and it matters for our bandwidth bill.
5. **The update applies on the next cold start.** By default the user gets it the *second*
   time they open the app after we publish, not mid-session — deliberately, so the UI never
   changes under someone's fingers. (We can override this; see
   [document 5](./05-runbook.md) §5.5.)

Two terms you'll see repeatedly:

- **Channel** — which audience a build listens to. We already have two: `preview` (internal
  dogfood builds) and `production` (what's in the stores). Publishing to `preview` cannot
  possibly reach real users. This separation already exists in `mobile/eas.json`.
- **Rollout** — publishing to a *percentage* of users. Ship to 10%, watch our Crashlytics
  dashboard for an hour, then go to 100% — or roll back having exposed only one user in ten.

---

## 1.7 What OTA is *not*

Three honest limitations, so expectations are calibrated:

- **It's not instant for everyone.** Users who don't open the app don't get the update. It's
  hours-to-a-day, not seconds.
- **It's not a substitute for testing.** Faster fixes tempt teams into sloppier releases. The
  discipline in [document 5](./05-runbook.md) exists specifically to resist that.
- **It doesn't help before launch.** OTA only reaches app installs that already exist. During
  the current migration our feedback loop is internal/TestFlight builds — which is exactly what
  the roadmap's executive summary already says.

---

**Next:** [2 — The options](./02-options.md) — who sells this, who gives it away, and what
each is actually like to live with.
