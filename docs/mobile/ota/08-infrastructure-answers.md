# 8 — Your answers, locked: Terraform, DNS, Argo, Postgres, testers

*You answered the five open questions from document 6. Four of them just close out — this
document records the decision so nobody re-opens it later. The fifth one, about Terraform and
DNS, was a real question with a real trap in it, and it gets most of the space below.*

---

## 8.1 What is now decided

| Question | Your answer | Consequence |
| --- | --- | --- |
| **Namespace** | `timecalendar-ota` — new namespace, no env suffix | One xprem serves all three channels. §8.6 |
| **Postgres** | The same server as TimeCalendar production; company DB, backed up externally; creds at implementation time | Control-plane mode confirmed — dashboard **and** progressive rollouts. §8.7 |
| **Cloudflare zone** | `timecalendar.app` is in Cloudflare, but **no DNS is in Terraform yet** | The whole of §8.2–8.5 |
| **Public beta** | Yes — two populations: internal staff, and student volunteers | **Three** channels, not two. Naming in §8.8 |
| **Play production access** | Confirmed | 4.0 ships as an update to the existing listing. The 14-day testing rule does **not** apply. One risk off the cutover critical path |

Everything in documents 4, 6 and 7 now stands unamended except where this document says otherwise.

---

## 8.2 "If we Terraform one DNS record, does it wipe the rest of the zone?"

**No. It cannot.** This is the most important paragraph in the document, so here is why, rather
than just the reassurance.

### There are two families of DNS-as-code tools, and they behave oppositely

**Family 1 — the mirror.** octoDNS, DNSControl, `external-dns` in sync mode, Cloudflare's own
zone-file import. You give these tools a file describing the zone, and they make the zone
**match the file**. Anything in the zone that isn't in the file is, by definition, drift — so
they **delete it**. Point one of these at `timecalendar.app` with a file containing one record
and you lose the website, the mail records and Zero Trust in a single run.

That is the tool you were imagining, and being wary of it is correct.

**Family 2 — the shopping list.** Terraform. Terraform keeps a **state file: a list of the
things Terraform itself created.** On every plan it compares *that list* against your config.
A record it never created is not "extra" — it is **invisible**. It does not appear in the plan.
It cannot be destroyed by the plan. Terraform has no opinion at all about things it doesn't know
exist.

**The Cloudflare provider is squarely family 2.** `cloudflare_dns_record` manages exactly one
record. There is no "manage this zone exclusively" flag, no authoritative mode, no sync switch.
Adding `ota.timecalendar.app` touches one record and nothing else.

### You can verify this yourself, without trusting me

`lyrolab/platform` already posts the Terraform plan as a comment on the PR before anything
applies (`terraform-plan-infra.yml`). The plan for this change will read:

```
Plan: 3 to add, 0 to change, 0 to destroy.
```

If Terraform were about to touch the rest of the zone, **the plan would say so** — that number
is the whole point of the plan step. The safety property you want is already built into how the
platform repo works; you just read the comment before merging, like you do today.

### The three ways it *could* actually go wrong, and how each is avoided

Being honest about the failure modes is more useful than a flat "it's safe":

| # | The risk | What actually happens | How we avoid it |
| --- | --- | --- | --- |
| 1 | **Collision** — we declare a record that already exists (same name + type) | Cloudflare's API rejects it: *"record already exists"*. The apply **fails**. Nothing is overwritten, nothing is lost | Can't happen for `ota.` — it's a brand-new name. If it ever does, the fix is to `import` the record rather than create it |
| 2 | **Owning the zone object** — someone writes `resource "cloudflare_zone"` | Terraform now owns the zone's *lifecycle*. Deleting that block, or a `terraform destroy`, means "delete the zone" — every record with it | **We use the data source, not the resource.** `data "cloudflare_zone"` is a read-only lookup by name. A data source has no create or delete path; it physically cannot remove anything |
| 3 | **Deleting our own block** — someone removes the `ota` resource from git | That one record is deleted on the next apply | Correct behaviour, and scoped to the one record we own. This is the *feature* — it's why declarative is worth having |

### So: no, we don't have to migrate the whole zone. And I'd recommend we don't — yet.

Adopting the full Cloudflare estate (DNS + Pages + Zero Trust) is a project, not a step. It
needs a much broader API token, and the risk isn't in writing the config — it's that a mistake
in records we otherwise never touch takes the website down for a change that was about mobile
updates.

**But there is a middle path that fits your declarative preference exactly.** Terraform 1.5+
has `import` **blocks** — the import is written *as code*, in a file, in a PR:

```hcl
import {
  to = cloudflare_dns_record.api_v2
  id = "${var.timecalendar_zone_id}/${var.api_v2_record_id}"
}
```

The plan comment then reads `1 to import, 0 to change, 0 to destroy`, you merge, and the record
is under Terraform. Nobody runs a stateful CLI command on a laptop; it's the same review flow as
every other change.

That gives us **lazy adoption**: whenever we next need to touch a record, we adopt it in the same
PR. In a year most of the zone is in Terraform and no one ever ran a migration. Adding the
provider now is what makes that possible later — it's the plumbing, not the commitment.

---

## 8.3 The two hostnames — and the one trap

We need **two** names, and they work differently. This matters, because getting it wrong lands
you in failure mode 1 above.

| Hostname | Serves | Who creates the DNS record |
| --- | --- | --- |
| `ota.timecalendar.app` | The xprem server (manifests) — an ingress on `do-fra1-cluster01` | **We do**, with `cloudflare_dns_record` |
| `ota-assets.timecalendar.app` | The R2 bucket (the actual JS bundles) over Cloudflare's CDN | **Cloudflare does**, automatically, when the R2 custom domain is enabled |

> **The trap:** `cloudflare_r2_custom_domain` takes a `zone_id` precisely because Cloudflare
> writes the DNS record for you. If we *also* declare a `cloudflare_dns_record` for
> `ota-assets`, the apply fails with "record already exists". Declare the custom domain, and
> leave that hostname's DNS alone.

**Why a custom domain for the bundles at all**, rather than proxying them through xprem: R2's
free egress and Cloudflare's cache only apply if the bundles are fetched from Cloudflare
directly. Route them through our own server and every byte becomes DigitalOcean egress, which is
metered — we'd have rebuilt the exact cost we chose R2 to avoid. It also keeps us clearly inside
Cloudflare's terms: R2 is a paid-per-use product built for serving files, whereas pushing large
non-HTML assets through a free-plan proxy is the thing their §2.8 is about.

---

## 8.4 What the Terraform actually looks like

In `terraform/envs/infra/`, following the existing `40-` / `50-` / `60-` per-concern tfvars
convention, plus a small module beside `modules/providers/digitalocean/spaces/`:

```hcl
# read-only lookup — owns nothing, can delete nothing
data "cloudflare_zone" "timecalendar_app" {
  filter = {
    name = "timecalendar.app"
  }
}

resource "cloudflare_r2_bucket" "timecalendar_ota" {
  account_id = var.cloudflare_account_id
  name       = "timecalendar-ota"
  location   = "WEUR"
}

resource "cloudflare_r2_custom_domain" "timecalendar_ota" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.timecalendar_ota.name
  domain      = "ota-assets.timecalendar.app"
  zone_id     = data.cloudflare_zone.timecalendar_app.zone_id
  enabled     = true
}

resource "cloudflare_dns_record" "ota" {
  zone_id = data.cloudflare_zone.timecalendar_app.zone_id
  name    = "ota"
  type    = "A"
  content = var.do_fra1_cluster01_ingress_ip
  proxied = true
  ttl     = 1 # 1 = "automatic", which is required whenever proxied = true
}
```

Resource names above are verified against the current `cloudflare/cloudflare` v5 provider docs.
Two details to check at implementation time rather than trust from a document: whether the zone
data source exposes `.zone_id` or `.id` (v5 renamed a lot of these), and whether
`api-v2.timecalendar.app` is proxied today — the TimeCalendar ingresses carry no `tls:` block,
which tells us TLS terminates at Cloudflare, and `ota.` should be created to match whatever
`api-v2` does rather than to match this snippet.

### One consequence for the platform repo

`terraform/README.md` already warns that a plan in `envs/infra` evaluates **all** resources, so
a Hetzner-only change fails without the DO Spaces credentials. Adding Cloudflare makes that
worse by one: from now on **every** local infra plan needs `CLOUDFLARE_API_TOKEN` too. That's a
README line, not a design problem — but it is the kind of thing that wastes someone's afternoon
in six months, so it goes in the same PR.

Credentials are unchanged from [doc 6 §6.7](./06-your-questions-answered.md#67-cloudflare-r2-in-terraform--which-keys-and-the-process-for-adding-them):
one **API token** for Terraform (Account → Workers R2 Storage : Edit, Zone → DNS : Edit, Zone →
Zone : Read for the lookup), and one **R2 S3 key pair** for xprem, created by hand and sealed.
Worth knowing: the company already holds a Cloudflare API token — `cert-manager` on
`hz-hel1-dev-main` uses one for DNS-01 challenges, sealed into git. Different scope, different
blast radius, so a separate token — but the sealed-secret path is a well-trodden one here.

---

## 8.5 Argo and the namespace

`timecalendar-ota` it is. Files, matching the shape of `timecalendar-production` exactly:

```
kubernetes/clusters/do-fra1-cluster01/
├── 00-namespaces/timecalendar-ota-namespace.yaml
├── 05-rbac/…                                        # if we want scoped access, same as siblings
├── 10-platform/argocd/apps/timecalendar-ota.yaml    # the Argo Application
└── 20-apps/timecalendar-ota/
    ├── kustomization.yaml
    ├── values.yaml
    └── env-sealed-secret.yaml                       # R2 key + Postgres URL
```

Same multi-source Argo shape as `timecalendar-production` — the chart comes from one repo and
our `values.yaml` from `lyrolab/platform` via `ref: values` — with one simplification: xprem's
chart is **upstream**, so we don't also carry a chart of our own. Two sources rather than three.

---

## 8.6 Postgres

The DigitalOcean managed cluster that TimeCalendar production already uses
(`private-db-postgresql-fra1-…`). That answers both of my questions at once: it's reachable from
`do-fra1-cluster01` over the private network, and DO's managed backups already cover it. **No new
backup job, no new database server, no new bill.**

We create one database on it, `timecalendar_ota`, with its own user. Credentials arrive at
implementation time and go straight into the SealedSecret — they are never in a plan document.

Worth restating the blast radius, because it's small and people assume it isn't: if this
database is lost, we lose **channel pointers, rollout state and publish history**. We do not lose
the bundles — those are in R2 — and phones already holding a bundle keep running it. It's an
unpleasant afternoon, not an outage.

---

## 8.7 Naming the two tester populations

You described them exactly right and just wanted names. Here's the set I'd use, because it maps
one-to-one onto what the two stores actually call things:

| We call them | Who | Apple | Google | Build profile | OTA channel |
| --- | --- | --- | --- | --- | --- |
| **The team** | Us and company staff | TestFlight **Internal Testing** — up to 100 App Store Connect users, **no review**, available in minutes | **Internal testing** track — up to 100 emails, minutes | `preview` | `preview` |
| **Beta testers** | Students who volunteered | TestFlight **External Testing**, public link — up to 10,000 | **Closed testing**, via a Google Group | `beta` | `beta` |
| *(everyone)* | 60,000 students | App Store | Production track | `production` | `production` |

**I'd avoid the word "alpha" entirely.** Google uses "alpha" as the legacy name for the closed
track, Apple doesn't use it at all, and we only have two tester populations — so two names is
enough, and "alpha/beta" would invite a permanent argument about which is which. "The team" and
"beta testers" are unambiguous in both stores and in conversation.

Four practical things about running the beta programme, none of which are obvious until they
bite you:

- **TestFlight builds expire after 90 days.** OTA keeps the JavaScript fresh, but the binary
  underneath dies on a timer — so the beta needs a fresh build at least quarterly even in a quiet
  period. Worth a recurring reminder rather than a surprise.
- **TestFlight external needs Beta App Review** for the first build of each version — usually
  under a day, but it's not instant like internal. Plan the first beta build a day early.
- **Play closed testing via a Google Group makes registration nearly free**: a Google Form,
  then add the address to the group. That's the whole "student volunteers register" flow, and
  it's why closed testing beats open testing here — open testing puts a public opt-in banner on
  the store listing, which we don't want while 60,000 people are on the stable app.
- **Both populations get the production backend** ([doc 7 §7.3](./07-environments-and-testing.md)).
  Isolation comes from the channel, not from a separate database. Beta testers with fake
  timetables stop being testers.

This confirms **three channels** (`preview`, `beta`, `production`) rather than two, which is the
version documents 6 and 7 already describe. Nothing to change — just no longer conditional.

---

## 8.8 What's still open

Two things, neither blocking:

1. **The environment switcher in production builds** ([doc 7 §7.5](./07-environments-and-testing.md#75-switching-backends-inside-the-app)).
   My recommendation is a plain visible Settings row that exists in `preview`/`beta` builds and
   **is compiled out of production entirely** — rather than seven taps in the shipped app. Still
   your call.
2. **The 60,000 figure.** If it came from memory rather than a dashboard, it's worth five minutes
   in Firebase Analytics — it's the number the whole self-hosting recommendation rests on. Above
   ~15,000 the conclusion holds either way, so this is a confirmation, not a re-open.

---

*Back to the [index](./README.md) · previous: [7 — Environments, builds and testers](./07-environments-and-testing.md).*
