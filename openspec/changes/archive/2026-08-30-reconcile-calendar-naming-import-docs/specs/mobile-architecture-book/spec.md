# mobile-architecture-book — delta

## ADDED Requirements

### Requirement: The calendar naming and import epic's four decisions are ADR-backed

The Architecture Book SHALL contain and index an ADR for each of the four load-bearing decisions the
calendar naming and manual-import epic settled, and each ADR SHALL carry a concrete revisit
condition rather than only a rule:

1. **One ephemeral, non-persisted import draft** — already recorded as ADR 047. It SHALL be cited by
   the new records rather than restated in them.
2. **The calendar rename is a token-authorized shared mutation.** The ADR SHALL record that
   possession of the calendar token is the whole capability — there is no owner, no account, and no
   per-holder permission — that a rename is therefore global to every installation holding that
   token, that duplicate names are accepted and last write wins, and that per-device aliases,
   ownership, and rename permissions were rejected, not overlooked.
3. **`/v1` is a path-level prefix on individual controllers, never global NestJS versioning.** The
   ADR SHALL record that `app.enableVersioning` is deliberately not enabled because it would apply a
   default version to every controller while Flutter release builds in the field call the
   unversioned paths, SHALL name the routes that carry the prefix today, and SHALL state that an
   API-wide versioning migration is deferred rather than decided.
4. **Calendar names converge eventually, through a name-only sync write.** The ADR SHALL record that
   the sync path writes only the name, never upserts a `user_calendars` row and never routes through
   the DTO mapper that hard-codes `visible: true`, that the event replace and the name write-back
   are two failure domains by design, and that convergence is therefore eventual — a failed name
   write leaves last-good names in place and retries at the next sync.

Each new ADR SHALL be added to the `decisions/README.md` index, SHALL be linked from the topical
file that already carries its rule (`features.md` for the rename and convergence records, `data.md`
for the versioning record), and SHALL be accompanied by a dated `CHANGELOG.md` entry, per the book's
own rules. The ADR numbers SHALL be verified against `main` **and against open pull requests** at PR
time, because two ADRs sharing a number are two differently-named files that merge without conflict.

#### Scenario: The four decisions resolve to indexed ADRs

- **WHEN** the ADR index is read after this change
- **THEN** the rename capability model, the path-level `/v1` policy, and the name-convergence rule
  each resolve to their own indexed ADR
- **AND** the ephemeral import draft resolves to ADR 047, cited rather than duplicated

#### Scenario: Each record carries a revisit condition

- **WHEN** each of the three new ADRs is read
- **THEN** it names a concrete trigger that reopens that decision alone
- **AND** the trigger is specific to that decision rather than shared across all three

#### Scenario: The topical rule and its record are linked

- **WHEN** the rename, convergence, and `/v1` paragraphs in `features.md` and `data.md` are read
- **THEN** each links to the ADR recording the decision behind it
- **AND** `CHANGELOG.md` carries a dated entry for the addition
