## Context

`eas init` created `@samuelprak/timecalendar` with project ID
`3b427ef6-1aae-4175-8217-ea447ee6df6b`. `mobile/app.config.ts` commits that public identifier
as its fallback and derives `updates.url` from it, while allowing `EAS_PROJECT_ID` to override
the fallback. The Architecture Book records this current state, but the main OpenSpec still
requires configuration that resolves before initialization with an absent or placeholder ID.

## Goals / Non-Goals

**Goals:**

- Make the authoritative specification describe the initialized project linkage.
- Preserve fresh-clone and explicit-override behavior.
- Keep the specification clear that the project ID is public configuration, not a credential.

**Non-Goals:**

- Running EAS builds, submissions, updates, or store rollouts.
- Adding or recovering signing credentials.
- Changing application configuration or release behavior.

## Decisions

The existing `expo-updates wired with a fingerprint runtime version policy` requirement is
modified in full because its project-ID behavior changed. A separate additive requirement would
leave the obsolete absent-ID scenario in force and create a contradictory contract.

The exact EAS owner, slug, and project ID are recorded because this delta reconciles the spec to
an already initialized external project. The ID remains overrideable through `EAS_PROJECT_ID`;
the committed fallback keeps clean clones deterministic and the override supports controlled
alternate EAS contexts.

## Risks / Trade-offs

- **The external EAS project could be deleted or transferred** → Treat such a change as a new
  distribution-contract update and revise config, Architecture Book, and OpenSpec together.
- **A project ID could be mistaken for a credential** → State explicitly that the identifier is
  public binary configuration; no token, signing key, or store credential is added.
