# 4 — Recommendation

*My engineering recommendation. It is **provisional** on one number — our monthly active user
count — and I've marked exactly where that number bites.*

---

## 4.1 The recommendation

**Ship version 3.0 on EAS Update, on the paid Starter plan ($19/month), with a written
rollout-and-rollback discipline and a recorded trigger to move to self-hosting if the bill
grows.**

Four parts:

1. **Use EAS Update** — Expo's hosted service. It's already wired into the app; the remaining
   work is a decision and a process, not a project.
2. **Pay the $19.** Do not launch a production app on the free tier. The free tier's silent
   hard stop at 1,000 monthly active users would disable our emergency mechanism during
   precisely the enrolment spike where we'd need it ([document 3](./03-costs.md) §3.2).
   *(If our peak MAU turns out to be comfortably under ~700 — with headroom for a September
   spike — Free is defensible. I'd still pay the $19: it's the cheapest insurance in our stack.)*
3. **Write the discipline down before the first update, not after the first incident** —
   channels, percentage rollouts, a monitoring window, one-command rollback. That's
   [document 5](./05-runbook.md).
4. **Record the self-hosting trigger** so the decision gets revisited automatically instead of
   drifting: **when the EAS Update bill exceeds ~$100/month sustained for two months
   (≈20,000 MAU), migrate to self-hosted xprem on our existing DigitalOcean cluster.** At that
   point the annual saving (~$1,100+) clearly exceeds the 1–2 days of setup, whereas today it
   doesn't come close.

---

## 4.2 Why this, and not the alternatives

**Why not self-host from day one?** At launch scale it saves ~$14/month and costs 1–2 days of
setup plus a permanent ownership tax — a payback measured in *years*
([document 3](./03-costs.md) §3.4). More importantly, the 3.0 cutover is the highest-risk
moment in this project's life: the entire user base migrating onto a codebase that has never
faced production scale. On that day I want our emergency mechanism to be the boring,
battle-tested one that someone else is on call for. **Self-host later, from a position of calm
— not during a cutover.**

**Why not the free tier?** Covered above and in [document 3](./03-costs.md) §3.2. A cap that
engages silently, mid-month, with no option to pay your way out, sitting between us and our
users on the exact mechanism we built for emergencies. $19 removes the entire failure mode.

**Why not a third-party vendor?** Their pitch is "escape CodePush", and we were never on
CodePush. They'd cost us a proprietary SDK swap for no capability we don't already have
([document 2](./02-options.md) §2.4).

**Why not do nothing?** A launch-week regression would be unfixable for 1–3 days. The
capability costs $19/month ([document 2](./02-options.md) §2.5).

**Why is this safe to decide now, before the answers?** Because it's reversible. The Expo
Updates Protocol is an open spec, and every self-hosted option speaks it. Migrating later is a
URL change plus a server deploy — no app rewrite, no store release, invisible to users. **We
are not making a one-way door; we're picking a starting point.**

---

## 4.3 How your answers change this

| If you tell me… | The recommendation becomes… |
| --- | --- |
| Peak MAU is **under ~700** | Free tier is defensible; I'd still take the $19 as insurance |
| Peak MAU is **3,000–37,000** | Unchanged — Starter, with overage. Cheaper than the $199 plan until ~37k |
| Peak MAU is **over ~37,000** | Self-hosting jumps the queue: $199/mo vs $5/mo pays back setup in weeks. Likely **self-host from day one** |
| **Budget is €0, firm** | Self-host xprem now (~$5/mo) and I absorb the setup — I'd push back on doing this *during* the cutover, but it's viable |
| **EU residency is a hard requirement** | Self-host on our EU (fra1) cluster from day one. Not otherwise our posture — we already send analytics to Firebase in the US |
| **You want weekly OTA feature delivery** | Same tool, stricter process: mandatory staged rollouts, a fixed publish day, no Friday publishes ([document 5](./05-runbook.md)) |
| **You want emergency-only OTA** | Same tool, and the bill may be much lower — if Expo's "downloads at least one update" MAU definition is literal, quiet months bill near zero. **I'd confirm that with Expo before we plan around it** |

---

## 4.4 What actually needs doing, and when

Nothing here is urgent — the app isn't in the stores yet. This slots into roadmap step 10
(*Parity, cutover & release*), which already lists "OTA setup" as a line item.

### Before the 3.0 store submission

| # | Task | Owner | Effort |
| --- | --- | --- | --- |
| 1 | Confirm the plan choice (needs your MAU answer) and set billing on the Expo account | You + me | 15 min |
| 2 | Configure the `expo-updates` runtime policy explicitly in `app.config.ts` — check-on-launch behaviour, timeout budget, and how we surface "an update is ready" to the user. Today only the URL is set; the defaults are sane but should be a **conscious, documented choice** rather than an inherited one | Me | ½ day |
| 3 | Verify the end-to-end loop on a real device: publish to `preview`, confirm the dogfood build picks it up, confirm a fingerprint-changing build correctly does **not** | Me | ½ day |
| 4 | Rehearse a rollback on `preview` — the first time we run `eas update:rollback` must not be during an incident | Me | 1 hour |
| 5 | Turn [document 5](./05-runbook.md) into the team's release checklist and add an ADR to the Architecture Book recording the decision | Me | ½ day |

**Total: ~2 days of my time, none of it on the critical path today.**

### Deliberately deferred

- **Self-hosting** — trigger recorded in §4.1. Not now.
- **Update code signing.** `expo-updates` supports cryptographically signing updates so a
  compromised server can't push malicious JavaScript. It's real defence-in-depth and it also
  costs release-process complexity (key management, key rotation). My read: **not needed at
  launch** — the threat model is "someone compromises our Expo account", which is better
  addressed by 2FA and access hygiene. **Revisit when we self-host**, since at that point the
  server genuinely is our own attack surface. Recorded as debt, not skipped silently.
- **Automating OTA publishing in CI.** Deliberate: a human should decide when users get a
  surprise update. Revisit if manual publishing becomes a bottleneck.

---

## 4.5 What I'd like from you

1. **Answer the six questions** in the issue thread — especially the MAU one.
2. **Confirm or challenge the recommendation.** If you'd rather self-host from day one on
   principle, say so; it's a legitimate call and I'll plan it properly rather than argue.
3. **Nothing else is blocked on this.** The app isn't in the stores; this decision has to be
   *made* before submission, not before the next feature.

---

**Next:** [5 — Day-one runbook](./05-runbook.md) — how we'd actually operate this without
hurting anyone.
