# Tasks — shared Drizzle test fake (R-2)

## 1. The shared helper
- [x] 1.1 Add `mobile/src/test-support/fake-db.ts` implementing `createFakeDb({ tables })`
      per design.md: per-table `Map` stores, token→store registry, `eq`/`asc`, the
      `select`/`insert`/`update`/`delete`/`transaction` builders with shared `jest.fn`
      spies, `module` / `spies` / `reset()` / `seed()` / `rows()`. Fully typed (no
      `any` leaks past the `Record<string, unknown>` row shape the existing fakes use).
- [x] 1.2 File header comment: what it fakes, the `mock`-prefix hoisting rule for
      consumers, and why it lives in `test-support/`.

## 2. Restart tests → shared fake (behavioural, unchanged assertions)
- [x] 2.1 `calendar-sources/data/user-calendars/restart.test.ts` — build via `createFakeDb`
      (single `userCalendars` table, pk `id`); keep every read-back/upsert/remove assertion.
- [x] 2.2 `event-checklists/data/restart.test.ts` — two tables (`checklistItems` pk `uuid`,
      `calendarEvents` pk `uid`); keep the ordered read-back, setChecked/setContent,
      remove, reorder, and the checklist-survives-`replaceAll` soft-ref proof (bare
      `db.delete(calendarEvents)` clears only that store).
- [x] 2.3 `calendar/data/sync/restart.test.ts` — `calendarEvents` table pk `uid`; keep the
      replaceAll read-back, full-replace, and empty-clear assertions (whole-table
      `select().from()`).

## 3. Repository tests → shared fake (shape, via `spies` + `seed`)
- [x] 3.1 `personal-events/data/repository.test.ts` — `spies.select/from/where/insert/values/
      onConflictDoUpdate/delete/eq`; `seed(personalEvents, …)` for the findAll/getById reads.
- [x] 3.2 `event-checklists/data/repository.test.ts` — add `spies.orderBy/asc/update/set` +
      the transaction path (reorder → `spies.update` ×3, `spies.set` order 1/2/3,
      `spies.transaction` once).
- [x] 3.3 `user-calendars/data/repository.test.ts` — findAll/getById/getByToken/upsert/
      remove/setVisible via spies + `seed`.
- [x] 3.4 `calendar/data/sync/repository.test.ts` — transactional drop+replace via
      `spies.transaction` once, `spies.delete`/`spies.insert` with `calendarEvents`,
      delete-before-insert `invocationCallOrder`, `spies.values` first-call length 2, and
      the 120-row → 3-chunk `spies.insert` count.

## 4. Fold the wrapper tests
- [x] 4.1 Delete `personal-events/data/uid.test.ts`, `event-checklists/data/id.test.ts`,
      `calendar-sources/data/user-calendars/id.test.ts`. Leave `uid.ts` / `id.ts` sources.
      RESOLVED (Resolution A, FoundingEngineer): the implementer correctly found (verified
      empirically — the gate fails 0% on all three) that deleting the tests alone breaks the
      K-3 gate, because design decision 4's "covered transitively" premise is false. Fix:
      delete the tests AND add a documented `!src/features/**/{id,uid}.ts` exclusion to
      jest.config.js — the three files are pure `expo-crypto.randomUUID` forwarders whose
      only possible unit is a native-module-mocking delegation test (proving nothing but the
      language), so they belong with the existing E2E/native-seam coverage exclusions
      (api/mutator, api/config). Honors the ticket's "fold the cargo-cult tests" AND holds
      the gate green. Supersedes design decision 4.
      ORIGINAL implementer note (kept for the record): design.md decision 4 claims
      `newId`/`newEventId` "stay covered transitively (every repository insert mints an
      id)", but that premise is false: the repositories accept caller-supplied ids, and
      EVERY transitive caller's test mocks the generator (`build.test.ts` mocks the
      `@/features/personal-events/data` barrel's `newEventId`; `hooks.test.ts` mocks
      `./id`; the user-calendars `newId` has no real caller at all — only barrel
      re-exports). So with the wrapper tests gone, `uid.ts` / `id.ts` drop to 0% and the
      90%-gated `src/features/*/!(ui)/**` threshold fails. A pure `randomUUID` forwarder
      can only be covered by a delegation test that mocks `expo-crypto` (no off-device JS)
      — i.e. exactly the wrapper tests. The constraint forbids editing jest.config.js, so
      the tests are kept and this box is left unchecked for the reviewer to adjudicate
      (revise design decision 4, or accept a jest.config coverage exclusion for these
      three one-liners).

## 5. Architecture Book + verify
- [x] 5.1 `docs/mobile/architecture-book/testing.md` — one-line pointer to
      `src/test-support/fake-db.ts` as the shared `@/db` fake (mock-at-seam pattern).
- [x] 5.2 `npm test` green (all suites); `tsc --noEmit` clean; lint clean; K-3 coverage
      gate held (82 suites / 505 tests, coverage exit 0 — WITH the three wrapper tests
      retained, see 4.1). The 7 target suites pass 31/31.
