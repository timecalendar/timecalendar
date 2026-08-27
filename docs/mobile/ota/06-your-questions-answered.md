# 6 — Your questions, answered

*Round 2. You read documents 1–5 and came back with 17 questions. Each one is answered below,
in the order you asked, in plain language. Where a question changed my mind or exposed
something wrong in the earlier documents, I say so and I've fixed the document.*

**Nothing here is implementation.** This is still the discussion. The implementation issue
(TIM-171) stays in the backlog until you're happy.

---

## What changed in documents 1–5 because of your questions

| What | Why |
| --- | --- |
| `ota.timecalendar.fr` → **`ota.timecalendar.app`** | You're right, I invented the `.fr`. Fixed everywhere |
| The word **"dogfood" is gone** | Bad jargon. It now says "internal build" / "preview build", and §6.9 defines it |
| xprem now runs in **control-plane mode with Postgres**, not stateless | Your free database changes this — and progressive rollouts *require* the control plane (§6.6) |
| **Update code signing promoted** from "deferred follow-up" to "do it in the same batch" | Your question made me re-examine it. Adding it later forces an extra store release (§6.15) |
| **Crashlytics OTA tagging added** as an explicit task | It does not happen automatically and it's ~10 lines (§6.14) |
| **Publishing moves into CI**, triggered by a git tag, with a human gate | Your declarative preference. Doc 4 said "no CI publishing"; that was the wrong reading of my own concern (§6.11) |
| Runbook §5.3 rewritten around **multi-fix updates published from a release branch** | You're right that one update = many fixes (§6.13) |
| New [document 7](./07-environments-and-testing.md) | Your alpha/beta/TestFlight question is bigger than OTA and deserved its own document |

---

## 6.1 Alpha/beta releases — do they get their own channel? What happens with a new native library?

**Short answer: yes, their own channel; and yes it works — but only for testers who have
installed a *new build*, and the tooling guarantees that rather than trusting us to remember.**

### The two dials, which people constantly confuse

There are two independent things deciding whether a given phone gets a given update:

| Dial | What it controls | Set by | Analogy |
| --- | --- | --- | --- |
| **Channel** | *Which audience* — who is allowed to see this stream of updates | Us, baked into the binary at build time | Which radio station the receiver is tuned to |
| **Runtime version (fingerprint)** | *Which phones can physically run it* — computed from the native shell | The tooling, automatically | Whether the receiver can decode that broadcast at all |

You can only get hurt by the second one, and it's the one we don't control by hand.

### Your scenario, step by step

> *"We publish an update with a new native library, but publish this update only for alpha
> users. Will it still work?"*

1. You add the native library to the project. **The fingerprint changes** — from `A` to `B` —
   because the fingerprint is a hash of the native side (dependencies, plugins, native config).
2. You build a new binary and hand it to alpha testers (TestFlight / Play internal track).
   That binary's runtime version is `B`.
3. You publish the JS that uses the library, to the `beta` channel. The tooling stamps it
   runtime version `B`, computed from your working tree.
4. An alpha tester on the **new** build asks: *"channel `beta`, runtime `B`, anything for me?"*
   → **yes**, and it works.
5. An alpha tester still on the **old** build asks: *"channel `beta`, runtime `A`?"* → **the
   server says nothing new.** They keep running what they have. **No crash.** They get it when
   they install the new build.
6. A production user asks: *"channel `production`, runtime `A`?"* → also nothing. They're on a
   different channel *and* a different runtime. Two independent walls.

**So: the answer to "will it still work" is yes, and the answer to "could it break someone" is
no — but only because a new native library means the alpha testers need a new build first.
OTA can never hand anyone a native library.** That's the one hard rule, and it's enforced
mechanically, not by discipline.

### Does it use the same OTA channel? Do we need different things?

Different channel, same everything else. A channel is just a string. Adding one costs:

- one line in `eas.json` (a build profile with `"channel": "beta"`),
- one line in the app config so a locally-built binary stamps it (§6.17),
- nothing at all on the server — xprem creates channels on first use.

There is no per-channel cost, no per-channel infrastructure, and no limit worth worrying about.

**My proposal is three channels**, laid out in full in
[document 7](./07-environments-and-testing.md):

| Channel | Who | How they install |
| --- | --- | --- |
| `preview` | Us, on our own phones | TestFlight internal / Play internal testing |
| `beta` | Public beta testers (students who opt in) | TestFlight external / Play closed testing |
| `production` | Everyone | App Store / Play |

---

## 6.2 Progressive rollout when the JS needs a newer native library; and maintaining multiple versions

Two separate questions inside one. Taking them in order.

### (a) "Newer JS that uses a new native library" — you cannot get this wrong

This is §6.1 again, and the reassuring answer is that **there is nothing to manage.** The
moment you add the native library, your working tree's fingerprint changes, and every update
you publish from then on is stamped with the new fingerprint. Phones with the old shell are
invisible to it. There is no configuration, no version check you have to write, no `if
(Platform.hasScanner)` guard. It is impossible to deliver that JS to a phone that can't run it.

The thing you *do* manage is the consequence: **users on the old build are now stranded on the
old JS lineage until they update from the store.** Store auto-update drains most of them in
about two weeks. If one of them needs a hotfix before then, see (b).

### (b) Multi-version maintenance and hotfixing 2.6.x while 2.7.x is current

**Your instinct is right: yes, it looks like "check out the old tag, cherry-pick the fix,
publish again". That is genuinely how it's done.** But it's cheaper than it sounds, because
you don't need separate branches or channels on the *server* side.

**The mental model.** An update *branch* on the server holds many updates, each stamped with a
runtime version. A phone asks *"channel `production`, runtime `A`"* and the server hands back
**the newest update on that branch that is stamped `A`**. So a single `production` branch
serves 3.0, 3.1 and 3.2 users simultaneously, each getting their own newest compatible bundle,
with no bookkeeping from us.

**The catch is on the publishing side**, not the serving side. To publish an update stamped
runtime `A`, your working tree has to *produce* fingerprint `A` — because the fingerprint is
computed locally from your source. Hence the checkout.

In practice, one fix that must reach both lines:

```bash
# The current line
git switch main
npx eoas publish --branch production --message "3.1.2 — TIM-201 duplicate events"

# The previous line, still in a lot of hands
git switch release/4.0                # a maintenance branch we keep alive
git cherry-pick <sha>                 # the same fix
npx eoas publish --branch production --message "3.0.5 — TIM-201 duplicate events"
```

Two commands, one branch on the server, no channel gymnastics. The fingerprints sort themselves
out — the second publish is automatically stamped `A` because `release/4.0` still has the old
dependency set.

**Keeping `release/4.0` alive as a real git branch is the whole trick.** Without it you'd be
detaching HEAD at a tag under pressure at 23:00, which is exactly when you don't want to be
doing git archaeology.

### How other teams actually handle this

Three postures, in increasing order of cost:

1. **Support only the latest runtime version.** Most small teams. Users on older builds get no
   OTA fixes; you rely on store auto-update to drain them. Zero overhead. Perfectly defensible
   once you're in a steady state.
2. **Support the current version plus the previous one (N-1).** Keep one maintenance branch;
   important fixes get cherry-picked. Moderate overhead, big safety win right after a release.
3. **Version branches on the server** (`version-3.0`, `version-3.1`) with a channel pointed at
   each. More machinery; it earns its keep when you have many concurrent supported versions or
   enterprise customers pinned to old releases. Not us.

**My recommendation for us: posture 1 by default, posture 2 during the 6–8 week launch
window.** During the cutover, "3.0 has a bad bug and store adoption is only at 40%" is exactly
the scenario OTA exists for, so we hold `release/4.0` open. After it settles, drop back to
"latest only" and stop paying the tax.

### One reframing that makes this much less scary

**How many runtime versions exist is largely our choice.** The fingerprint only changes when
the *native* side changes. If 3.0 → 3.1 → 3.2 add no native dependencies, they all share one
fingerprint, and there is literally nothing to maintain — one publish reaches everybody.

Native churn is what creates the multi-version tax. Which is a real argument for **batching
native changes**: add three native libraries in one release rather than one per release, and
you fragment your fleet once instead of three times.

---

## 6.3 When we publish, do we need at least one build for the fingerprint?

**Precisely: no build is needed to *publish*; a matching build must exist in users' hands for
anyone to *receive*.**

The fingerprint is computed **locally, from your source tree**, at publish time — it hashes
dependencies, native project files, config plugins, and app config. `eoas publish` does this
itself; you never type a version number.

So you *can* publish an update whose fingerprint matches no build anywhere. Nothing bad
happens — it just sits there, delivered to nobody. (This is failure mode #1 in runbook §5.6:
*"published it, nobody got it"*.)

**The practical rule:** a native change means **build → distribute → then OTA works for that
line.** And the first OTA after a store release must be published from a tree that still
fingerprints identically to what you built and submitted.

**The gotcha worth internalising:** the fingerprint hashes your *dependencies*, so a routine
`npm update` can silently move it. Bumping a pure-JS library usually doesn't; anything that
pulls native code does. You find out by running the fingerprint tool, not by guessing:

```bash
npx expo-updates fingerprint:generate     # what is my tree's fingerprint right now?
```

**I'd wire this into CI** so a PR that changes the fingerprint is labelled as such
automatically. Then "does this need a store release?" is answered by a bot on every PR, not by
someone remembering. That's a small task and it's worth doing before the first real OTA.

---

## 6.4 Where do we use `preview`? And the whole preprod/alpha/beta strategy

This is the biggest question you asked and it's genuinely broader than OTA, so it has its own
document: **[7 — Environments, builds and testers](./07-environments-and-testing.md)**.

The one-paragraph version: four audiences (you-and-me developing, us on real phones, public
beta testers, everyone), four ways to install, three OTA channels. TestFlight and Play's test
tracks are the distribution mechanism; the OTA channel is a *label inside the build* that says
which stream it listens to. They're separate systems that we line up deliberately.

Your **hidden backend switcher** idea is answered in [document 7 §7.5](./07-environments-and-testing.md#75-switching-backends-inside-the-app).
Short version: **the idea is good, the seven-taps-to-unlock part I'd drop.** We already have
the exact seam to gate it (`extra.appVariant`, the same one that gates the dev import deep
link), so we can make it a plain, visible setting in preview/beta builds that **does not exist
at all** in the production binary. That gets you everything you wanted, without the App Review
question about hidden functionality and without a confused student ending up on preprod. The
full reasoning — including what I'd do if you *do* want it in production builds — is in
document 7.

---

## 6.5 The domain is `timecalendar.app`

Correct, and I invented the `.fr`. Fixed in documents 2 and 4. The OTA hostname is
**`ota.timecalendar.app`**.

*(Answered: the zone **is** in our Cloudflare account, but no DNS is in Terraform yet. That
turned out to be a question worth a section of its own — [doc 8 §8.2](./08-infrastructure-answers.md)
covers whether Terraforming one record endangers the rest of the zone. Short answer: it can't.)*

---

## 6.6 Postgres — and yes, the dashboard is free

**Yes. Take the database. It buys us two things that matter, both free.**

xprem has two shapes:

| Mode | Needs | What you get |
| --- | --- | --- |
| **Stateless** | Nothing but a bucket | Publish and serve updates. No dashboard, **no progressive rollouts** |
| **Control plane** | **+ Postgres** | Multi-app dashboard, branches/channels management, **progressive rollouts**, rollback history |
| *(Observability)* | *+ ClickHouse* | *Per-device crashes, metrics, logs. **We skip this** — Crashlytics already answers it* |

Licensing, which is the part you actually asked about: **the dashboard and progressive rollouts
are MIT and free.** The project states the release engine — branches, channels, progressive
rollouts, storage backends and the dashboard — "is MIT and will stay MIT". Four features sit
behind a commercial licence in `ee/` directories: **RBAC, SSO, branch protection, and custom
device attributes.** We need none of the four (we are two people; branch protection is a
policy we can just… follow).

**This changes document 4.** I had planned stateless mode to keep the footprint minimal.
That was wrong for two reasons: rollouts need the control plane, and you're offering the
database for free. **Control-plane mode it is.**

**Answered:** the DigitalOcean managed cluster that TimeCalendar production already uses — so
it's reachable from `do-fra1-cluster01` over the private network and DO's managed backups
already cover it. No new database server, no new backup job. Details in
[doc 8 §8.6](./08-infrastructure-answers.md).

---

## 6.7 Cloudflare R2 in Terraform — which keys, and the process for adding them

Yes, let's Terraform it. Here's exactly what it takes, grounded in how `lyrolab/platform`
already works.

### What gets declared

In `terraform/envs/infra/` — a new `70-timecalendar-ota-r2.auto.tfvars` alongside the existing
`40-observability-spaces` / `50-boardbot-spaces` / `60-vaultwarden-spaces` files:

| Resource | What it is |
| --- | --- |
| `cloudflare_r2_bucket` | The bucket holding the JS bundles. Location hint `WEUR` |
| `cloudflare_r2_custom_domain` | Serves the bucket at a hostname of ours over Cloudflare's CDN |
| `cloudflare_dns_record` | The DNS entry for **`ota.timecalendar.app`** (the xprem server). The bundle hostname's record is created by Cloudflare itself — see the trap in [doc 8 §8.3](./08-infrastructure-answers.md) |
| `cloudflare_r2_bucket_lifecycle` | Optional: expire bundles older than N months, so history doesn't grow forever |

Plus a new provider in `versions.tf` / `providers.tf` (`cloudflare/cloudflare`, v5.x — the v5
line rewrote most resource schemas, so v4 examples you find online won't apply).

### The two kinds of key — don't conflate them

This is the part worth being precise about, because they're different credentials with
different blast radii.

**1. A Cloudflare API token, for Terraform itself.**
Env var `CLOUDFLARE_API_TOKEN`. Scopes, minimum:

- Account → **Workers R2 Storage : Edit** — create and manage buckets
- Zone → **DNS : Edit**, on `timecalendar.app` only — the custom-domain record

That's it. Notably **not** `User → API Tokens : Edit`, which the provider only needs if we ask
Terraform to *mint* R2 access keys. See below for why I don't want that.

**2. An R2 S3-compatible access key pair, for xprem.**
An Access Key ID + Secret that the update server uses to read and write objects. Cloudflare
mints these as a bucket-scoped R2 token.

### My recommendation: Terraform the bucket, create the xprem key by hand

Terraform the bucket, the custom domain, the DNS record and the lifecycle rule. **Create the
xprem S3 key once, by hand, in the Cloudflare dashboard, and seal it into git as a
SealedSecret** — same as the existing DO Spaces keys for Vaultwarden.

Two reasons, both real:

- **Privilege.** Letting Terraform create API tokens means granting the Terraform token the
  power to mint tokens. That's a privilege-escalation footgun: a leaked CI token stops being
  "can manage buckets" and becomes "can manufacture credentials".
- **State.** A Terraform-created key lands in Terraform state in plaintext. HCP Terraform state
  is remote and encrypted at rest, but it becomes a place we store live secrets, which it isn't
  today. One manual key, created once, sealed, documented in the runbook, is the cleaner
  posture and matches what the repo already does.

### The process for adding the key — there isn't a special one, and that's fine

Per `terraform/README.md`: providers read variables that default to `null` and fall back to
their standard environment variable; CI injects those from GitHub Actions secrets. So the
change is three steps:

1. Create the token in Cloudflare with the scopes above.
2. Add repo secret `CLOUDFLARE_API_TOKEN` to `lyrolab/platform`.
3. Add `CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}` to the `env:` block of
   **both** `terraform-plan-infra.yml` and `terraform-apply-infra.yml`, and add a row to the
   README's credentials table.

We also need the **Cloudflare account ID**, which is not a secret — it goes in a tfvars file
like the other non-secret identifiers.

### Two things to flag before we do it

- **The README's existing gotcha gets worse.** `terraform plan` in `envs/infra` evaluates *all*
  resources, so today a Hetzner-only change already fails without DO Spaces credentials. Once
  Cloudflare is in there, a local plan will need the Cloudflare token too. Worth a line in the
  README.
- **Don't try to import the existing Cloudflare estate in this change.** You mentioned DNS,
  Pages and Zero Trust are in Cloudflare but not yet in Terraform. Adding the provider for one
  new bucket is a small, reviewable change; adopting the whole account is a project. Adding the
  provider now makes that project *easier later* (the plumbing exists, someone can
  `terraform import` a zone at a time) without dragging it into this one.

---

## 6.8 xprem via Argo — namespace and Application

Yes, and it fits the existing repo shape exactly. Concretely, mirroring how `mailpit` (a
third-party workload) and `timecalendar-production` (ours) are laid out:

```
kubernetes/clusters/do-fra1-cluster01/
├── 00-namespaces/timecalendar-ota-namespace.yaml         # new namespace
├── 05-rbac/timecalendar-ota-rbac.yaml                    # scoped kubeconfig, matching the pattern
├── 10-platform/argocd/apps/timecalendar-ota.yaml         # the Argo Application
│   └── (+ one line in apps/kustomization.yaml)
└── 20-apps/timecalendar-ota/
    ├── kustomization.yaml
    ├── values.yaml                                       # xprem Helm values
    └── env-sealed-secret.yaml                            # R2 keys, DATABASE_URL, admin secret
```

The Application uses the two-source shape (chart from upstream, values from this repo) that
`timecalendar-production` already uses — `repoURL` pointing at xprem's chart with `ref: values`
resolving against `lyrolab/platform`. Same `syncPolicy: automated / prune / selfHeal` as
everything else.

**Namespace — decided: `timecalendar-ota`.** The reasoning, kept because it records an
intentional exception to a convention: every existing namespace is `<app>-<env>`
(`timecalendar-preprod`, `timecalendar-production`). The OTA server isn't per-environment —
one server serves the `preview`, `beta` and `production` channels, because channels are an
*application-level* concept, not an infrastructure one. So I'd call the namespace
**`timecalendar-ota`** with no env suffix, and note the exception in the change. The
alternative — folding it into `timecalendar-production` — is tidier against the convention but
means the internal-testing update path shares a namespace and a blast radius with the
production API. You took the separate namespace.

---

## 6.9 What is a "dogfood build"? (and I've stopped saying it)

Fair complaint. **"Dogfooding" is industry slang** — from "eating your own dog food" — meaning
*the team uses its own product for real, before customers do*. It's a habit, not a thing.

You're right that I used it as though it were a defined artefact. It's gone from the docs. What
I actually meant, every time, was:

> **A preview build: a real, release-configuration build of the app — the same kind of binary
> we'd ship to the store, not the Metro development server — installed on our own phones, and
> tuned to the `preview` OTA channel that no real user is ever on.**

Three properties make it useful, and all three come from it being a *release* build:

- The JavaScript is bundled and minified, exactly as users will run it. Bugs that only appear
  in release configuration (and there are always some) show up here and not in development.
- `expo-updates` is **active**, so it actually exercises the update mechanism we're testing.
- It's on the `preview` channel, so publishing to it **cannot** reach a real user, whatever we
  get wrong.

So "we dogfood on preview for the whole port" meant: *for the remaining months of the RN port,
the app on our own phones is a preview build served by our own OTA server, so by the time real
users arrive we've published dozens of real updates to real devices.* That's the argument for
building the server now rather than at the cutover, and it's the same argument — just without
the jargon.

---

## 6.10 Development builds don't use OTA, right?

**Correct.** Your daily loop is completely unaffected. Three modes, and only the third does OTA:

| Mode | Where the JavaScript comes from | OTA? |
| --- | --- | --- |
| `npx expo start` + development build on your phone or a simulator | **Metro on your machine**, over the LAN | **No.** `expo-updates` doesn't run its automatic check in development |
| A `development` profile build (the dev client) installed without Metro running | The bundle embedded at build time | **No** — same reason |
| A `preview` / `beta` / `production` build | Embedded at build time, then replaced by OTA | **Yes** |

Two things worth knowing:

- Our `development` profile sets `APP_VARIANT=development`, which gives it a **different bundle
  ID** (`fr.samuelprak.timecalendar.dev`). So a dev build installs *alongside* a preview or
  production build on the same phone. Preview and production **share** a bundle ID and cannot
  coexist — see [document 7 §7.3](./07-environments-and-testing.md).
- There *is* a debugging feature ("channel surfing") that lets a development build deliberately
  point at an OTA channel to inspect an update. It's opt-in and manual — useful when
  investigating "why did this device get that bundle", never on by accident.

---

## 6.11 Declarative over imperative — how far can we take this?

Good instinct, and the honest answer is that **this splits cleanly into two halves that should
be treated differently, and pretending otherwise would build something bad.**

### The infrastructure half: 100% declarative, no exceptions

Bucket, DNS, custom domain, lifecycle rule, namespace, RBAC, Argo Application, xprem deployment
and its config, secrets. **All of it is Terraform + Argo + SealedSecrets, exactly like
everything else we run.** There is nothing special about an OTA server; it's a small stateless
Go service. §6.7 and §6.8 are that half, and it needs no compromise.

### The publishing half: imperative by nature, and that's correct

`eoas publish` takes your working tree, bundles it, uploads it and creates an **immutable
artefact**. That is a *build*, not a *desired state* — the same category as `docker build &&
docker push`. And you already accept exactly this asymmetry: our container images are produced
imperatively by CI, and only the *reference* to them is declarative.

Trying to make artefact production declarative doesn't make it better, it makes it a Rube
Goldberg machine.

**But** there *is* a genuinely declarative layer hiding here, and it's the important one:
**which update each channel points at, and at what rollout percentage, is server state that
could in principle live in git.** So the real question is how far up that ladder to climb.

### The three rungs, and where I'd stop

**Rung 1 — git is the source of truth for the artefact. Do this.**
Every publish comes from a tagged commit; the publish message carries the issue references and
the SHA. The channel pointer lives in xprem; the record of what we did lives in git and the
issue tracker. This is where essentially every React Native team is, and it's already better
than most.

**Rung 2 — publishing is a CI workflow triggered by a git event, not a laptop command. Do this
too.** Pushing a tag like `ota/preview/3.0.4` runs a workflow that publishes to `preview`;
promotion to `production` is a `workflow_dispatch` with a required approval. What you gain:

- the OTA signing key and server credentials live in GitHub secrets, **not on my laptop**;
- every publish has an immutable audit trail and a reviewable definition;
- the *procedure* is code, so it can't drift or be half-remembered at 1am;
- it's reproducible by anyone, which matters the day I'm not around.

**Document 4 said the opposite** — it deferred CI publishing on the grounds that "a human
should decide when 60,000 people get a surprise update". Your question made me see that I'd
conflated two things. That concern is about the **decision**, and a manual approval gate keeps
the human in it entirely. The **mechanism** should absolutely be code. I've corrected document
4.

**Rung 3 — a git-declared channel state reconciled by a controller. Don't. At least not yet.**
The shape would be a `channels.yaml` in the repo and a job that calls xprem's API until reality
matches. Three reasons against:

- It's writing an Argo-for-OTA — real software, that we'd own, on the critical path of our
  emergency mechanism.
- It **fights the rollout workflow**. A rollout percentage is a dial you turn on human
  judgement inside a 30-minute window while watching a crash graph. Expressing that as
  merge-a-PR-to-go-from-10%-to-50% adds latency to the exact loop that exists to be fast.
- **Declarative is the wrong tool for the incident path.** At 23:00 with a bad bundle on 60,000
  phones, "roll back" must be one command with one credential, not a pull request waiting for
  CI.

So: **infrastructure fully declarative; publishing via CI from git tags with a human approval
gate; channel pointers and rollout percentages imperative, deliberately.** I'd write that last
clause into the ADR so nobody re-litigates it in a year — including me.

---

## 6.12 Progressive rollout, concretely: a flag? Server or client?

**Server-side. Always. The client has no idea a rollout is happening.**

The phone asks one question — *"channel X, runtime Y, what should I run?"* — and the server
answers. That's the whole client role. It means:

- there is no rollout logic in the app, so it can't be tampered with to grab an update early;
- changing the percentage takes effect immediately for everyone who hasn't checked yet, with no
  app change;
- and — importantly — **the split is deterministic and stateless.** The server derives the
  in-or-out decision by hashing the device's installation ID against the update, so a given
  phone is *consistently* in the 10% or out of it. It doesn't re-roll the dice on every launch.
  A non-deterministic split would mean users flip-flopping between two bundles, which is
  precisely the bug you don't want in your safety mechanism.

**The commands.** On the hosted path (EAS) the syntax is public and documented:

```bash
eas update --rollout-percentage=10        # publish, exposed to 10%
eas update:edit                           # raise it: 10 → 50 → 100
eas update:revert-update-rollout          # abort; everyone back to the previous update
```

with one constraint worth knowing: **only one update per branch can be rolling out at a time**
for a given runtime version. You finish or abort before publishing the next one. That's a
feature — it stops you stacking two half-rolled-out changes and being unable to tell which one
broke things.

On **xprem** it's the same concept, driven from the dashboard or the CLI, and it's the reason
we want control-plane mode with Postgres (§6.6) — a rollout is server state, so it needs
somewhere to live. **I'm deliberately not quoting xprem's exact flag names here, because I
haven't run them.** Pinning that syntax down on a real device is task 4 of the implementation,
before runbook §5.3 becomes the real checklist. I'd rather leave a gap than put a
plausible-looking command in a document you'll follow during an incident.

The mental model to carry: **a rollout is a dial you turn while watching Crashlytics, not a
setting you configure once.** 10% → watch → 50% → watch → 100%.

---

## 6.13 One update usually contains several fixes, not one

You're right, and the runbook's single-issue example message was misleading. This is worth
being precise about because it's the most common way teams hurt themselves with OTA.

**An update is a snapshot of the entire JavaScript bundle, not a patch.** There is no such
thing as shipping "just this fix". Whatever is in the tree you publish from *is* the update.

Two consequences, and the second is the one that bites:

**1. Message convention.** A version-ish title plus the issue list, so the update list is
readable six months later:

```
4.0.4 — TIM-201 duplicate events on week boundary, TIM-205 FR month names, TIM-208 crash on empty week
```

and tag the commit (`ota/4.0.4`) so every update maps to an exact SHA.

**2. Publish from a deliberate commit, never from whatever happens to be on `main`.**
This is the real point. If you publish `main` to fix one crash, you also ship every feature
that merged that morning — half-finished, unreviewed on device, and now on 60,000 phones. The
fix was urgent; the cargo it carried wasn't.

So: **keep a `release/4.0` branch.** Work merges to `main`; fixes destined for users get
cherry-picked to `release/4.0`; **we publish `release/4.0`.** Then an emergency publish carries
exactly what we intended and nothing else — and, conveniently, it's the same branch that makes
hotfixing an older line easy (§6.2b). One mechanism, two problems solved.

Runbook §5.3 has been rewritten around this.

---

## 6.14 Can Crashlytics report the OTA version?

**Yes — but not by itself. We have to wire it, it's about ten lines, and without it OTA
debugging is genuinely painful.**

### The problem

Crashlytics groups crashes by **app version** — that's the native build, `3.0.0 (42)`. It has
no concept of which JavaScript bundle is running. So after an OTA, a brand-new crash appears
under build 42 — the build that was perfectly healthy yesterday. You'd be staring at a version
that didn't change, wondering why it started crashing.

### The fix

`expo-updates` exposes everything we need at runtime. Set them as Crashlytics custom keys once,
at startup:

```ts
import * as Updates from "expo-updates"

crashlytics().setAttributes({
  otaUpdateId: Updates.updateId ?? "embedded",
  otaChannel: Updates.channel ?? "none",
  otaRuntimeVersion: Updates.runtimeVersion ?? "",
  otaCreatedAt: Updates.createdAt?.toISOString() ?? "",
  otaIsEmbedded: String(Updates.isEmbeddedLaunch),
})
```

Now every crash report carries the exact bundle that was running. `isEmbeddedLaunch` is the
quietly valuable one: it tells you whether that user had actually taken the update, or was
still on the bundle that shipped inside the store binary — which is the first question you ask
during a rollout.

Worth doing the same on Analytics as user properties, which gives you an adoption curve in
Firebase alongside the one in the xprem dashboard.

### Two honest caveats

- **Custom keys are filterable, not groupable.** Crashlytics will still show one row for build
  42; you segment by filtering on `otaUpdateId`. That's enough to answer "did the crash-free
  rate drop after this update", which is the question the runbook asks. It's not as clean as a
  separate version row.
- **Stack traces are the weak spot.** Symbolicating a JavaScript stack trace needs the source
  map for *that exact bundle*, and an OTA bundle has a different source map from the one
  uploaded at build time. Getting OTA source maps into Crashlytics is the difference between a
  readable stack and a wall of minified nonsense. **I've added it as an explicit task** rather
  than a footnote, and I want to verify the exact mechanism on a device rather than assert it
  here — this is the sort of detail that's easy to get subtly wrong from documentation.

---

## 6.15 What does "update code signing" mean?

Fair — I used the term without defining it, twice.

### The plain version

Without code signing, our app trusts **whatever the update server sends it**. The only
protection is HTTPS, and HTTPS answers *"am I really talking to ota.timecalendar.app?"* — it
does **not** answer *"did we actually write this code?"*

Code signing adds the second guarantee:

1. We generate a **key pair**, once. The **public** half — a certificate — is baked into the
   app binary when we build it. The **private** half lives somewhere only release engineering
   can reach.
2. Every published update is **signed** with the private key.
3. Before running a downloaded bundle, the app **verifies the signature** against the embedded
   certificate. Wrong signature or no signature → the update is refused and the app keeps
   running what it has.

The seal analogy: HTTPS is a sealed courier envelope — nobody read it in transit. Code signing
is a wax seal with our crest on the letter *inside* — proof of who wrote it, regardless of who
carried it.

### The threat it kills

**Anyone who compromises the update server, the R2 bucket, or our DNS can push arbitrary
JavaScript to every phone running our app.** With 60,000 users, that is remote code execution
on 60,000 devices, delivered by our own auto-update mechanism. TLS is no help whatsoever,
because the attacker *is* the server.

Code signing means an attacker who takes the server can *deny* updates (annoying, recoverable)
but cannot *forge* one (catastrophic, not recoverable).

### Why my recommendation changed

Document 4 called this "deferred, but a genuine follow-up". Re-examining it because you asked:

- **The certificate is embedded in the binary at build time.** So adding code signing later
  requires a **new store release** — a full build, submission and review — before it protects
  anybody.
- We are about to make the 4.0 build anyway. **The natural moment to embed the certificate is
  the build we're already making.** Doing it then costs about half a day. Doing it in six
  months costs a forced store release we wouldn't otherwise need.

**So I've moved it into the same batch as the server build.** It's the cheapest it will ever
be, and it removes the one genuinely serious downside of self-hosting.

### The ongoing cost, honestly

**Key rotation.** The certificate has an expiry date, and rotating it needs a new store build
(because the certificate is embedded). Pick a long validity — 10 years is normal — and this is
a non-event. Where the private key lives matters more:

**Not in the repo, and — importantly — not in a SealedSecret.** SealedSecrets are for things
the *cluster* needs. The cluster must never hold the signing key, because "someone compromises
the cluster" is exactly the threat we're defending against; putting the key there defeats the
entire mechanism. It belongs with the store signing keys: **Vaultwarden**, plus a GitHub
Actions secret once publishing moves into CI (§6.11).

---

## 6.16 Update-check UX — is your intuition right?

Your proposal, restated: *on app start, check for an update with a 3–5s timeout; if there is
one, apply it and run the new version immediately; show the splash or a progress bar meanwhile.*

**Half right, and the half that's wrong is the expensive half.** Let me give you the numbers
rather than an opinion.

### What the dials actually are

`fallbackToCacheTimeout` — how long launch will **block** waiting for the update server.
Default `0`: don't block at all. Check in the background, download in the background, apply on
the **next** cold start.

So today's behaviour is: users get a fix the *second* time they open the app after we publish.

### Why I'd not block the splash

- **You pay the cost on every launch; you get the benefit on almost none.** A 3–5 second budget
  is spent by every user on every cold start, forever, to speed up the handful of launches per
  month where an update happens to be waiting. At 60,000 users opening a timetable app in the
  07:30–09:00 rush — on a train, on 4G — that's a lot of perceived slowness bought for very
  little.
- **The timeout is only the *check*.** The manifest request is the fast part. The bundle
  *download* is separate — around 1.25 MB with bundle diffing, which is a couple of seconds on
  good mobile data and much worse on bad. A naive "block until applied" can be 10+ seconds of
  splash on the connection quality where it hurts most.
- **A progress bar for a 1–2 second download flashes**, which reads as jank rather than
  polish. If we ever do block, a static splash is the right treatment.

### What I'd do instead — the hybrid

1. **Normal launches: don't block.** `fallbackToCacheTimeout: 0`. Cold start stays exactly as
   fast as it is today. Check and download in the background.
2. **Apply at the next natural boundary, not the next cold start.** Use the `useUpdates()` hook:
   when a downloaded update is ready *and* the app returns to the foreground after having been
   backgrounded, call `Updates.reloadAsync()`. The user has already mentally left the app, so
   the reload is invisible — and adoption goes to near-100% within a day instead of waiting for
   a genuine cold start. **This is the pattern mature RN teams converge on**, and it's the part
   of your intuition that's exactly right: you shouldn't have to wait for a second launch.
3. **Never prompt.** No "an update is available — restart?" dialog. Users decline, or don't
   understand the question, and you end up with a fleet permanently split across bundles.
   Silent is both kinder and more reliable.
4. **In a real emergency, the lever is the rollout dial, not the UX.** If we've shipped
   something bad, what matters is how fast we can *stop* it — and rollback rides the same
   mechanism regardless of how aggressively we check.

**And then measure.** After the first real update we'll have an actual adoption curve. If it's
genuinely slow for our users, revisit with data rather than intuition — mine included. It's a
one-line config change either way, which is why it isn't worth agonising over now.

---

## 6.17 Channel stamping — what I meant, and why I flagged it

A **channel is a label baked into the binary at build time.** The app sends it as an HTTP header
(`expo-channel-name`) on every update check, and the server uses it to pick which stream to
answer with. A binary listens to exactly one channel for its entire life — it's decided at
build time and cannot be changed from the server.

**"Stamping" is just the act of writing that label into the binary.** Bad shorthand on my part.

### Why it's an open item for *us* specifically

**`eas build` stamps it automatically**, from the `channel` field in `eas.json` — which we
already have (`preview`, `production`). If we built on EAS, this would be a non-issue.

**But we build locally** (Architecture Book, ADR 006). A local `xcodebuild` or `gradlew` build
does not read `eas.json`. If nothing stamps the channel, the binary sends **no channel header**
and receives **no updates at all** — silently, with no error, indistinguishable from "there's
nothing new for you".

That's a nasty failure to discover late: everything looks configured, and updates simply never
arrive.

### The fix, and it's the declarative one you'd prefer

Set it in `app.config.ts` rather than depending on the build tool:

```ts
updates: {
  url: "https://ota.timecalendar.app/manifest",
  requestHeaders: { "expo-channel-name": CHANNEL },   // from the same env var as APP_VARIANT
}
```

Now the channel lives in git, next to everything else that varies by variant, and it behaves
identically under `eas build` and a local build.

**One subtlety I want to verify on a device before committing to this**, and I'd rather flag it
than gloss it: app config is one of the inputs to the fingerprint. If `updates.requestHeaders`
is hashed into it, then preview and production builds would have *different fingerprints* — so
a bundle published for preview could never be promoted to production, we'd have to republish
from the same commit. That's arguably *more* safety, but it's a real behavioural difference and
I want to know rather than guess. If it turns out that way, the fix is a `.fingerprintignore`
entry or stamping the channel natively instead. Either way it's an afternoon, but it's exactly
the kind of thing that's annoying to discover after the first store build.

Also: if we set the channel in `app.config.ts`, we should **remove** `channel` from `eas.json`
so there is exactly one source of truth.

---

## 6.18 What I needed from you before implementation — all answered

These five are closed. [Document 8](./08-infrastructure-answers.md) records the answers and
what each one changed.

| | Question | Answer |
| --- | --- | --- |
| 1 | **Namespace** (§6.8) | `timecalendar-ota`, new namespace |
| 2 | **Postgres** (§6.6) | The TimeCalendar production DO managed cluster; backups already covered |
| 3 | **The `timecalendar.app` zone** (§6.5) | In Cloudflare — but no DNS in Terraform yet ([doc 8 §8.2](./08-infrastructure-answers.md)) |
| 4 | **Public beta** ([doc 7](./07-environments-and-testing.md)) | Yes — two populations, so **three** channels |
| 5 | **Play production access** | Confirmed; the 14-day rule doesn't apply to us |

Still worth a five-minute confirmation, not blocking: **sanity-check the 60k** if it came from
memory rather than a dashboard — it's the number the recommendation rests on.

---

**Next:** [7 — Environments, builds and testers](./07-environments-and-testing.md) — the
broader question you asked in §6.4.
*Back to the [index](./README.md).*
