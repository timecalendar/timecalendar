# Human checklist — what only you can do

**Status:** handover (TIM-171) · **Written:** 2026-08-25 · **Audience:** the human owner

The implementation is being handed to AI agents that work on machines **without** production
access — no `doctl`, no `kubectl`, no Cloudflare dashboard, no Vaultwarden. Everything that
needs live credentials either (a) was done on 2026-08-25 during handover (§4), (b) is on this
list for you to do before you leave (§1), or (c) is a step the agents will ping you for
mid-implementation (§2).

---

## 1. Before you leave (blocking — agents stall without these)

Everything in this section is **done** except 1.3 (commit this file).

### 1.1 Create the Cloudflare API token — ✔ done (in `platform/.env` + repo secret)

In the Cloudflare dashboard (the account that owns the `timecalendar.app` zone):
**My Profile → API Tokens → Create Token → Create Custom Token**, with exactly:

| Scope | Permission |
| --- | --- |
| Account → Workers R2 Storage | Edit |
| Zone → DNS | Edit — **restrict Zone Resources to `timecalendar.app` only** |
| Zone → Zone | Read |

Do **not** grant *User → API Tokens: Edit* (see [doc 6 §6.7](./06-your-questions-answered.md)
for why).

Notes on your two constraints:

- **Growing this token later is fine.** Cloudflare lets you edit an existing token's
  permissions and zone list in place — the token value doesn't change, so nothing downstream
  (GitHub secret, `.env`) needs rotating when the Terraform migration adds more zones or
  resource types. When that day comes, widen this token rather than minting a second one.
- **Multi-account is fine.** Terraform only needs this token to match the account that holds
  `timecalendar.app`. Other zones on other Cloudflare accounts are invisible to it and
  unaffected. If a later migration covers zones in another account, that account gets its own
  provider alias and its own token — this one never needs cross-account reach.

Then put the token in two places:

```bash
# 1. Local, for any manual terraform plan on this machine
echo 'CLOUDFLARE_API_TOKEN=<token>' >> ~/Projects/Perso/platform/.env

# 2. CI, for terraform-plan-infra.yml / terraform-apply-infra.yml
gh secret set CLOUDFLARE_API_TOKEN -R lyrolab/platform
```

(The agents will edit the two workflow files and the `terraform/README.md` credentials table —
that part is code, not credentials.)

### 1.2 Write down the Cloudflare Account ID — ✔ done

Dashboard → open the `timecalendar.app` zone → **Overview** → right-hand sidebar → **Account
ID** (also the hex segment in the dashboard URL, `dash.cloudflare.com/<account-id>/…`). It is
not a secret. Paste it here so agents can read it:

> **Cloudflare Account ID:** `14aae3b2652552e6739cd50be84561ce`

### 1.3 Commit this file and push.

(The pre-sealed OTA secret and the kubeseal RBAC grant went to the platform repo by PR —
nothing else to commit there.)

---

## 2. During implementation — the agents will ping you for these

### 2.1 Rotating the R2 access keys (already created and sealed)

The bucket-scoped R2 keys are sealed into `timecalendar-ota-env-secret`. To rotate: create a
new key in the dashboard (**R2 → API → Manage API tokens** — Object Read & Write, scoped to
`timecalendar-ota`), re-seal, merge, delete the old key. Sealing runs on `devlt` — it has
`kubectl` + `kubeseal` (in `~/.local/bin`) and the `paperclip-agent` kubeconfig, whose
`paperclip-agent-kubeseal` Role allows online sealing (fetching the public sealing cert —
never decryption, which only the in-cluster controller can do). Hand values to an agent via a
file (e.g. `devlt:~/.config/timecalendar-ota/r2.env`), never chat. The sealing command:

```bash
printf '%s' '<value>' | kubeseal --raw \
  --controller-namespace kube-system --controller-name sealed-secrets-controller \
  --namespace timecalendar-ota --name timecalendar-ota-env-secret
```

Each output goes under `spec.encryptedData` in
`kubernetes/clusters/do-fra1-cluster01/20-apps/timecalendar-ota/env-sealed-secret.yaml`
(sealing binds to namespace + secret name, so data-key names can be renamed freely). The
agents will write this rotation procedure into the `timecalendar-ota` README in the platform
repo — full key-mint automation is impossible by design, because it would require the
*User API Tokens: Edit* grant we refused in 1.1.

### 2.2 Review and merge platform-repo PRs

Agents have no Terraform or Argo credentials. CI does. Their loop is: open PR on
`lyrolab/platform` → `terraform-plan-infra.yml` posts the plan as a PR comment → **you read
the plan and merge** → apply runs / Argo syncs. The R2 PR's plan should read
`Plan: 3 to add, 0 to change, 0 to destroy` — anything with `destroy` in it, stop and ask.

### 2.3 Anything needing live `kubectl`/`doctl`

If an agent needs a live check (pod status, manifest endpoint), it will give you the exact
command to run on this machine and paste back.

---

## 3. When you take over (after agents finish)

### 3.1 Generate and store the update code-signing key

⚠️ **Deadline: before the first 3.0 store build** — the certificate is embedded in the binary
at build time; missing it costs a full extra store release ([doc 6 §6.15](./06-your-questions-answered.md)).

```bash
cd ~/Projects/Perso/timecalendar/mobile
npx expo-updates codesigning:generate \
  --key-output-directory codesigning/keys \
  --certificate-output-directory codesigning/certs \
  --certificate-validity-duration-years 10 \
  --certificate-common-name "TimeCalendar"
```

- The **certificate** (`codesigning/certs/`) is committed — the agents will have wired
  `app.config.ts` to reference its path.
- The **private key** (`codesigning/keys/`) goes into **Vaultwarden**, alongside the store
  signing keys, then is deleted from disk. Never in the repo, never in a SealedSecret.

### 3.2 Verify on real devices

Install a `preview` build on a real iPhone and a real Android phone, publish a trivial change,
confirm pickup on next launch, rehearse `eoas rollback`, and confirm a fingerprint-changing
build does **not** pick up the update ([doc 4 §4.7](./04-recommendation.md) tasks 4–5).

### 3.3 Deferred until CI publishing is built (not now)

- GitHub `production` environment with a required-reviewer gate — **free**: environments and
  protection rules are free on public repos, and `timecalendar/timecalendar` is public.
- GitHub Actions secrets for the signing key and xprem publish credentials.
- Store/TestFlight/Play testing setup ([doc 7](./07-environments-and-testing.md)) — explicitly
  out of scope for this phase.

---

## 4. Already done (2026-08-25 handover, on the prod-access machine)

| Item | Detail |
| --- | --- |
| Postgres database | `timecalendarota` created on the existing DO cluster `db-postgresql-fra1` (`f8f25297-bcbe-4caa-899a-2acef599c13c`) |
| Postgres user | `timecalendarota`, owner of the database; verified it can connect and create tables (PG 14). Password refetchable anytime with `doctl databases user get f8f25297-bcbe-4caa-899a-2acef599c13c timecalendarota` |
| SealedSecret | `timecalendar-ota-env-secret` pre-sealed with `DATABASE_URL` (private host `private-db-postgresql-fra1-…:25060`, `sslmode=require`) and a generated `ADMIN_PASSWORD`; committed to the platform repo by PR; R2 keys join it via §2.1. The admin password exists only in ciphertext until the app deploys — read it then, on this machine, with `kubectl get secret -n timecalendar-ota timecalendar-ota-env-secret -o jsonpath='{.data.ADMIN_PASSWORD}' \| base64 -d` |
| devlt sealing capability | `kubectl` v1.33.4 + `kubeseal` 0.18.1 installed in `devlt:~/.local/bin`; `paperclip-agent-kubeseal` Role (kube-system, `services/proxy` scoped to the controller Service) applied and committed; verified end-to-end from devlt: cert fetch + seal both work |
| R2 bucket | `timecalendar-ota` (WEUR), Terraform-managed via the `cloudflare/r2` module (platform PR #68, applied by CI); `CLOUDFLARE_API_TOKEN` wired into the plan/apply infra workflows and the README credentials table |
| R2 access keys | Hand-minted in the dashboard, bucket-scoped, sealed into `timecalendar-ota-env-secret` (platform PR #69). The secret is complete: `DATABASE_URL`, `ADMIN_PASSWORD`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` |
| Machine audit | `kubectl`, `doctl`, `gh` (samuelprak), Expo login, `kubeseal`, `terraform` (HCP login present) all working on this machine; `platform/.env` holds `DIGITALOCEAN_TOKEN`, `SPACES_*`, `HCLOUD_TOKEN`, `TF_VAR_grafana_auth` |

## 5. Decisions locked at handover (agents: do not re-litigate)

| Decision | Value |
| --- | --- |
| Self-hosted xprem + Cloudflare R2 | **Ratified** |
| Storage | **R2** (not DO Spaces) |
| Environment switcher | **Compiled out of production**; visible Settings row in development/preview/beta only |
| Tester group names | **"The team"** and **"Beta testers"** — the word *alpha* is banned |
| R2 lifecycle rule | **Skipped** for now |
| Steady-state publish day | Undecided, irrelevant until publishing exists |
| 60,000 MAU | Confirmed by the owner |
| Scope of this phase | **OTA infrastructure only** — no store submission, no publish pipeline, no tester programmes |
| DB naming | `timecalendarota` (database and user), lowercase, no underscores |
