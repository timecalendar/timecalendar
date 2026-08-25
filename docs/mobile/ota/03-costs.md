# 3 — What it costs

*All prices verified 2026-08-25 against expo.dev/pricing, digitalocean.com/pricing and
developers.cloudflare.com/r2/pricing, and quoted in USD as the vendors do. Vendor pricing
moves — re-check before committing to a plan.*

---

## 3.1 The one number that decides everything: MAU

Every hosted OTA vendor prices per **monthly active user (MAU)**. Expo's billing FAQ defines
it as:

> *"a unique user of your app that downloads at least one update via EAS Update within a
> single monthly billing period."*

**Our number: ~60,000 monthly active users, and growing** (CEO, 2026-08-25). That single figure
decides this document — at 60k we are past every hosted plan's included allowance, and the
hosted-vs-self-hosted question stops being close. §3.3 works it through.

Two things worth internalising about the metric anyway:

1. **It is not our total install count** — it's users who actually open the app in a given
   month. For a timetable app that's a seasonal curve, peaking in September and January and
   troughing in July. The 60k is the peak, which is the right number to budget against.
2. **On the literal reading of Expo's definition, a month in which we publish nothing bills
   near zero.** Other Expo documentation describes usage in terms of update *checks* rather
   than *downloads*, and at our scale that ambiguity is worth thousands of dollars a year. It
   would need confirming with Expo before anyone planned around it — but since §3.4 recommends
   not being on their meter at all, it's now moot.

---

## 3.2 EAS Update — Expo's hosted pricing

| Plan | Price/month | Included MAU | Included bandwidth | Extra MAU | Extra bandwidth |
| --- | --- | --- | --- | --- | --- |
| **Free** | $0 | 1,000 | 100 GiB | ❌ **not allowed** | ❌ not allowed |
| **Starter** | $19 | 3,000 | 100 GiB | $0.005 each | $0.10/GiB |
| **Production** | $199 | 50,000 | 1 TiB | $0.005 each | $0.10/GiB |
| **Enterprise** | custom | 1,000,000 | 40 TiB | $0.00208 each | — |

### The free plan's hard stop

Read that ❌ carefully. On the Free plan you **cannot** pay for overage. When you hit 1,000
monthly active users, **update delivery stops until the 1st of the next calendar month.** It
doesn't degrade, it doesn't warn the user, and it doesn't invoice us — it just stops.

We are on the Free plan today, and we have ~60,000 users. So on the hosted path this cap isn't
a risk to manage, it's a wall we'd hit **within hours of the first publish** — on roughly the
2nd of every month, for the rest of the app's life. Free is fine for the `preview` channel —
our own phones — and nothing else.

*Source: Expo's documented free-plan enforcement — "Free plan accounts cannot incur overage
charges", limits reset on the first of each calendar month.*

---

## 3.3 What we'd actually pay on EAS, at our scale

**Assumptions**, stated so you can challenge them: ~5 MB full JavaScript bundle; bundle diffing
on (default in SDK 56) so a typical incremental download is ~1.25 MB; each active device
downloads each update once. Four updates a month in the steady state ≈ 5 MB per user per month;
during the hotfix-heavy launch period, more like eight ≈ 10 MB per user per month.

| Monthly active users | Best EAS plan | MAU cost | Bandwidth | **Total/month** | **Per year** |
| --- | --- | --- | --- | --- | --- |
| 2,000 | Starter | $19 | included | $19 | $228 |
| 10,000 | Starter | $19 + $35 overage | included | ≈ $54 | $648 |
| 30,000 | Starter | $19 + $135 overage | 150 GB → ~$5 | ≈ $159 | $1,908 |
| 50,000 | Production | $199 | included in 1 TiB | $199 | $2,388 |
| **60,000 — us today** | **Production** | **$199 + $50 overage** | 300–600 GB, within 1 TiB | **≈ $249** | **≈ $2,990** |
| 100,000 — us in ~2 years | Production | $199 + $250 overage | ~1 TiB, at the edge | ≈ $449 | ≈ $5,390 |

Two things fall out of this table.

**One: the crossover.** Starter-plus-overage is cheaper than the Production plan right up to
~37,000 MAU. Below that line, don't buy the $199 plan just because the number looks bigger. We
are well above that line, so Production is the correct hosted plan for us — but see §3.4.

**Two: the bill grows with our success, on the one axis we most want to grow.** Every new
cohort of students in September adds to it. That is the structural objection to the hosted
path at our scale, more than the absolute number.

**EAS Build is billed separately** and isn't part of this decision. Publishing an OTA update
does **not** consume build minutes, and we build locally anyway (EAS Build is deliberately not
wired into CI — Architecture Book, ADR 006). **This matters for the recommendation: because we
don't depend on EAS Build, self-hosting updates costs us nothing else and we can stay on the
free Expo plan for the tooling.**

---

## 3.4 Self-hosting — what it really costs

Because we already run a DigitalOcean Kubernetes cluster (`do-fra1-cluster01`), the compute
delta is close to noise. The only line item that scales with users is the bucket serving the
bundles — and the choice of bucket is where the real money is.

### The bucket is the whole cost question

| Bucket + CDN | Base | Included | Overage | At our 300–600 GB/mo | At 2 TB/mo |
| --- | --- | --- | --- | --- | --- |
| DigitalOcean Spaces | $5/mo | 250 GiB storage, **1 TiB transfer**, CDN included | $0.02/GiB storage, **$0.01/GiB transfer** | **$5** | ~$15 |
| **Cloudflare R2** | $0 | 10 GB storage, 1M writes, 10M reads — and **egress is free, always** | $0.015/GB-month storage | **$0** | **$0** |

R2 is the interesting one. Object storage vendors normally make their margin on egress; R2
charges **nothing** for it, permanently, by design. For a workload that is almost entirely
egress — 60,000 phones pulling bundles — that removes the only line that would have grown with
us. Our retained bundle history is on the order of 1–2 GB, so we sit inside the free tier's
10 GB; and even past it, we'd be billed on *how much history we keep*, not *how many users we
have*. That's the right axis.

### Full self-hosted cost

| Line item | Cost/month | Note |
| --- | --- | --- |
| xprem server pod | **$0** | Small stateless Go binary in existing cluster capacity. Its own node, if ever needed: ~$12–24 |
| Cloudflare R2 (storage + CDN) | **$0** | Free tier covers us; egress free at any scale |
| Postgres for the dashboard | **$0** | Alongside the database we already run. xprem can also run without one |
| ClickHouse (per-device metrics) | **not deployed** | We use Crashlytics for this. Deliberately skipped — see [document 4](./04-recommendation.md) §4.7 |
| **Infrastructure total** | **≈ $0** | And **flat** as we grow, which is the point |

Then the part that isn't on any invoice — and it is real:

| Line item | One-off | Ongoing |
| --- | --- | --- |
| Setup: deploy, TLS, bucket/CDN, key management, device verification | **1–2 days** of my time | — |
| Maintenance: version bumps, certificate renewals, cluster upgrades | — | ~1–2 hours/quarter |
| Incident risk: our OTA server is down during an emergency hotfix | — | Now our problem, not Expo's |

### Break-even at 60,000 MAU

At €500/day, the 1–2 day setup is a €500–1,000 one-off against **~$2,930/year saved**.

**Payback: about three days.**

For contrast, at 2,000 MAU the same setup saved $168/year and paid back in three to six *years*
— which is why the first draft of this pack recommended the hosted service. The recommendation
didn't change because the reasoning changed; it changed because the number did. Detail in
[document 4](./04-recommendation.md) §4.6.

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
| Under 1,000 MAU, internal builds only, pre-launch | EAS Free | **$0** |
| Under ~3,000 MAU | EAS Starter | $19 |
| 3,000–37,000 MAU | EAS Starter + overage | $19 → ~$190 |
| ~37,000 MAU and up | EAS Production | $199+ |
| **Us: 60,000 MAU and growing** | **Self-hosted xprem + Cloudflare R2** | **≈ $0** (vs $249 hosted) |
| Any scale, if we ever want out | Back to EAS Production — one URL change | $249+ |

The last row matters as much as the one above it. **Nothing here is a one-way door**: the Expo
Updates Protocol is an open spec, so hosted and self-hosted are the same app pointed at a
different URL ([document 2](./02-options.md) §2.0).

---

**Next:** [4 — Recommendation](./04-recommendation.md).
