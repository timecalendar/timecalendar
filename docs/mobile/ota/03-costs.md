# 3 — What it costs

*All prices verified 2026-08-25 and quoted in USD, as the vendors do. Vendor pricing moves —
re-check before committing to a plan.*

---

## 3.1 The one number that decides everything: MAU

Every hosted OTA vendor prices per **monthly active user (MAU)**. Expo's billing FAQ defines
it as:

> *"a unique user of your app that downloads at least one update via EAS Update within a
> single monthly billing period."*

Two consequences worth internalising:

1. **This is not our total user count** — it's users who actually open the app in a given
   month. For a timetable app that's a seasonal curve with spikes in September and January and
   a trough in July.
2. **On the literal reading of that definition, a month in which we publish nothing bills near
   zero** — no update published, nothing downloaded, no MAU counted. If we adopt an
   emergency-only posture that could genuinely cut the bill. I have flagged this as
   *worth confirming with Expo directly* before we lean on it: other Expo documentation
   describes usage in terms of update *checks*, and the difference between "checks" and
   "downloads" is the difference between a $19 bill and a $150 one. **Do not plan around it
   until confirmed.**

**I don't know our MAU** — it's the first question in the issue thread. Everything below is
therefore given as a curve, not a number.

---

## 3.2 EAS Update — Expo's hosted pricing

| Plan | Price/month | Included MAU | Included bandwidth | Extra MAU | Extra bandwidth |
| --- | --- | --- | --- | --- | --- |
| **Free** | $0 | 1,000 | 100 GiB | ❌ **not allowed** | ❌ not allowed |
| **Starter** | $19 | 3,000 | 100 GiB | $0.005 each | $0.10/GiB |
| **Production** | $199 | 50,000 | 1 TiB | $0.005 each | $0.10/GiB |
| **Enterprise** | custom | 1,000,000 | 40 TiB | $0.00208 each | — |

### The free plan's hard stop

Read that ❌ carefully, because it's the most important cell in the table.

On the Free plan you **cannot** pay for overage. When you hit 1,000 monthly active users,
**update delivery stops until the 1st of the next calendar month.** It doesn't degrade, it
doesn't warn the user, and it doesn't invoice us — it just stops.

Now picture the failure: mid-September, enrolment week, a timetable-rendering bug, and the
mechanism we built specifically to fix it has been silently switched off since the 14th
because 1,001 students opened the app. We'd discover it while trying to ship the fix.

**Free is right for the `preview` (internal dogfood) channel today. It is not a foundation for
a production release.** That single fact is what turns a $0 recommendation into a $19 one.

*Source: Expo's documented free-plan enforcement — "Free plan accounts cannot incur overage
charges", with limits reset on the first of each calendar month. Since the exact stop
behaviour is the pivot of my recommendation, I'd confirm it with Expo support at the same time
as the MAU-definition question in §3.1. Either way, $19/month makes the question moot.*

---

## 3.3 What we'd actually pay, at four scales

**Assumptions**, stated so you can challenge them: ~5 MB full JavaScript bundle; bundle
diffing on (default in SDK 56) so a typical incremental download is ~1.25 MB; four updates
published per month; each active device downloads each update once. That works out to roughly
**5 MB of bandwidth per active user per month.**

| Monthly active users | Best EAS plan | MAU cost | Bandwidth cost | **Total/month** |
| --- | --- | --- | --- | --- |
| **1,000** | Free (or Starter for safety) | $0 / $19 | included | **$0 / $19** |
| **2,000** | Starter | $19 | 10 GB — included | **$19** |
| **10,000** | Starter | $19 + $35 overage | 50 GB — included | **≈ $54** |
| **30,000** | Starter | $19 + $135 overage | 150 GB → ~$5 | **≈ $159** |
| **50,000** | Production | $199 | 250 GB — included | **$199** |

**Counter-intuitive but real: Starter-plus-overage is cheaper than the Production plan right
up to ~37,000 MAU.** Don't buy the $199 plan because the number in the table looks bigger —
buy it when the arithmetic says so, or when we want the bigger bandwidth allowance for its own
sake.

**EAS Build is billed separately** and isn't part of this decision. Worth knowing: publishing
an OTA update does **not** consume build minutes, and we currently build locally anyway (EAS
Build is deliberately not wired into CI — Architecture Book, ADR 006). The Free plan's 15
builds per platform per month is plenty for our current cadence; Starter adds $45 of build
credit, which slightly softens its $19.

---

## 3.4 Self-hosting — what it really costs

The pleasant surprise: because we already run a DigitalOcean Kubernetes cluster
(`do-fra1-cluster01`) and an S3-compatible bucket, the infrastructure delta is close to noise.

| Line item | Cost/month | Note |
| --- | --- | --- |
| xprem server pod | **$0** | A small Go binary in existing cluster capacity. If it ever needed its own node: ~$12–24 |
| DigitalOcean Spaces (storage + CDN) | **$5** | Flat rate: 250 GiB storage, **1 TiB outbound transfer**, CDN included |
| Postgres (optional, for the dashboard) | **$0** | Alongside the database we already run; can also run stateless without it |
| **Infrastructure total** | **≈ $5** | Flat, up to roughly **200,000 MAU** — that 1 TiB covers ~200k users at 5 MB each |

Then the part that isn't on any invoice:

| Line item | One-off | Ongoing |
| --- | --- | --- |
| Setup: deploy, TLS, bucket/CDN, key management, verify on a real device | **1–2 days** of my time | — |
| Maintenance: version bumps, certificate renewals, cluster upgrades | — | ~1–2 hours/quarter |
| Incident risk: our OTA server is down during an emergency hotfix | — | Now our problem, not Expo's |

**Break-even.** At €500/day, setup is €500–1,000 one-off.

- At **2,000 MAU**, self-hosting saves $14/month = $168/year → **payback in 3–6 years.**
  Not worth it. Not close.
- At **30,000 MAU**, it saves ~$154/month = **$1,850/year** → **payback in under a month.**
  Obviously worth it.

So this isn't a question of principle, it's a question of scale — which is why my
recommendation makes it a *trigger* rather than a *choice*. See
[document 4](./04-recommendation.md).

---

## 3.5 The costs nobody puts in the table

Whichever option we pick, OTA has a real non-monetary price and I'd rather name it up front:

- **Discipline.** The ability to ship in an hour is an invitation to ship carelessly. The
  runbook in [document 5](./05-runbook.md) — rollouts, a monitoring window, a hard "never on a
  Friday afternoon" rule — is the mitigation, and it costs us a little friction on purpose.
- **A second release path to keep straight.** Two ways for code to reach users means two
  mental models. The fingerprint policy removes the *dangerous* part of that, not the
  *cognitive* part.
- **Monitoring becomes load-bearing.** OTA without watching Crashlytics after publishing is
  just a faster way to break things. We already ship Crashlytics, so this is habit, not
  tooling.

---

## 3.6 Bottom line

| Scenario | Recommended | Cost/month |
| --- | --- | --- |
| Under 1,000 MAU, dogfood only, pre-launch | EAS Free | **$0** |
| 3.0 launch, under ~3,000 MAU | **EAS Starter** | **$19** |
| Growing, 3,000–37,000 MAU | EAS Starter + overage | $19 → ~$190 |
| Over ~37,000 MAU | EAS Production, **or migrate to self-hosted** | $199 → **$5** |
| Cost-minimising at any scale, accepting ownership | Self-hosted xprem | **$5** + our time |

---

**Next:** [4 — Recommendation](./04-recommendation.md).
