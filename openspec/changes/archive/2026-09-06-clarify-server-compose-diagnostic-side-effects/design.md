## Context

`bin/server-compose.sh` has two intentionally different paths. Its `project-name` mode exits
before certificate provisioning, while every Docker Compose pass-through command first invokes
`ci/certificates/ensure-certificates.sh`. The guard may create or renew `cert.pem` and `key.pem`
inside the current checkout, then commands such as `config` and `ps` ask Compose to inspect state
without changing a container, network, volume, image, or other Docker resource.

`bin/setup-dev.sh --compose-config` is also an early, file- and service-pure mode. A full setup run
is different: it may provision the same pair before trust and reachability checks, and its
unreachable-proxy branch calls the wrapper's `ps` pass-through. The current specification uses
an unqualified “non-mutating” requirement for that check, which contradicts the deliberate
pre-Compose guard even though the check does not mutate Docker.

This is a contract correction, not a request to change the wrapper. The existing first-use and
renewal behavior is already the chosen behavior and must remain intact.

## Goals / Non-Goals

**Goals:**

- Define one precise mutation boundary: diagnostics change no Docker resources.
- State that Compose-backed diagnostics may still provision or renew checkout-local, gitignored
  TLS material.
- Keep `project-name` and `--compose-config` accurately described as file- and service-pure.
- Add a focused, non-lifecycle proof that fails if the wrapper, specification, and handbook
  describe different boundaries.

**Non-Goals:**

- No behavior change in `bin/server-compose.sh`, `bin/setup-dev.sh`, or either certificate script.
- No Compose-subcommand allowlist and no attempt to decide whether provisioning is needed from the
  requested Compose verb.
- No certificate rotation, trust-store work, generated TLS commit, Docker lifecycle operation, or
  Docker-resource cleanup.
- No API, database, product, mobile, deployment, CI-workflow, or legacy Flutter change.

## Decisions

## Decision 1 — “Non-mutating” is scoped to Docker resources

The specification and handbook will use Docker resources as the boundary. A diagnostic satisfies
the contract only when it does not create, start, stop, restart, remove, or otherwise change a
Docker resource. Checkout-local TLS provisioning is a file side effect and is explicitly permitted
before a Compose-backed diagnostic.

This boundary captures the safety property that matters on a shared daemon: an inspection must not
disturb this checkout's stack or another checkout's stack. It also reports the actual wrapper
behavior instead of redefining “non-mutating” so broadly that a correct first-use guard violates the
contract.

**Alternatives considered:**

- **Make every diagnostic file-pure.** Rejected because it requires bypassing the existing guard
  based on Compose verbs and weakens the single, unconditional pre-Compose invariant.
- **Call all provisioning non-mutating without qualification.** Rejected because generating two
  files is a real side effect; the contract should name its boundary rather than hide it.

## Decision 2 — Preserve the two explicit pure modes, not a Compose allowlist

`bin/server-compose.sh project-name` and `bin/setup-dev.sh --compose-config` remain the explicit
file- and service-pure exceptions. Both already exit before their respective certificate-dependent
paths. Every Compose pass-through command keeps the same first-use guard, including read-only verbs
such as `config` and `ps`.

A verb allowlist is deliberately excluded. Compose has global flags, plugins, aliases, and evolving
subcommands; classifying them in the wrapper would make the guard depend on an incomplete parser and
create two sources of truth for Compose semantics. The current structural rule—pure local modes exit
early, otherwise guard then exec Compose—is smaller and more reliable.

**Alternative considered:** skip provisioning for known read-only Compose verbs. Rejected because
it broadens this documentation correction into wrapper behavior and risks missing a command shape.

## Decision 3 — Update both contract surfaces with the same three-part rule

The capability delta and handbook will state the same three facts:

1. Compose-backed diagnostics do not mutate Docker resources.
2. They may provision or renew the two checkout-local, gitignored TLS files.
3. `project-name` and `--compose-config` remain file- and service-pure.

The delta modifies the existing “Selected configuration is diagnosable” and “Unreachable TLS proxy
is attributed to the nginx container” requirements in full. The certificate requirements already
say the wrapper provisions before Docker Compose and already pin the first-use/renewal guard, so
duplicating or weakening them is unnecessary.

## Decision 4 — Extend the existing contract verifier without Docker lifecycle commands

Use `bin/verify-server-compose.mjs`, the existing manual contract harness, as the focused proof. Add
static assertions over the wrapper, specification, and handbook that pin the three-part rule and the
guard's placement after the `project-name` early exit and before `exec docker compose`. Keep all
Compose invocations in the harness at `config`; do not add `up`, `down`, `start`, `stop`, `restart`,
`rm`, `prune`, or any other lifecycle verb.

This is intentionally a contract assertion rather than a certificate-generation test. Destructive
setup for a first-use test would require deleting or moving a developer's current pair, and reading
certificate contents would add no proof about the documentation boundary. The existing certificate
guard contract remains covered by its own specification and established implementation.

The harness remains manual-only; this change does not edit a workflow merely to run a documentation
consistency check. Exact-head CI still supplies the standard regression proof for the proposal and
later implementation, while the focused local command is the direct acceptance proof.

**Alternatives considered:**

- **Add a second verifier.** Rejected because the existing harness already owns this capability and
  one focused extension is smaller.
- **Wire the harness into CI.** Rejected because that expands a contract wording correction onto a
  sensitive workflow and makes CI depend on checkout-local certificate generation for no added
  Docker-resource guarantee.
- **Exercise `ps` against the daemon.** Rejected because static source/contract assertions prove the
  boundary without depending on daemon state; the existing `config` renders remain the only Compose
  calls in the verifier.

## Risks / Trade-offs

- **[Text assertions can become overly brittle]** → Match the normative concepts and named pure
  modes within their relevant sections, not whole paragraphs or line numbers.
- **[“No Docker-resource mutation” is mistaken for “no side effects”]** → Put the TLS allowance in
  the same requirement and handbook paragraph, not in a distant caveat.
- **[A future wrapper edit moves the guard across the pure exit]** → The focused verifier checks the
  ordering of the early exit, guard, and Compose exec.
- **[Generated TLS material is accidentally staged]** → Do not remove or generate the pair during
  implementation; verify the paths remain ignored and untracked, and review the final diff for any
  certificate or key bytes.

## Migration Plan

Apply the specification delta, handbook wording, and focused verifier assertions together. Run only
syntax, contract, OpenSpec, diff, ignore/tracking, and disclosure checks locally; no Docker lifecycle
command is permitted. Rollback is a normal revert because no runtime behavior or persistent Docker
state changes.

## Open Questions

None. The dispatch fixes the intended boundary and explicitly rejects a subcommand allowlist.
