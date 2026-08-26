# Mobile architecture

This directory documents the current architecture of `mobile/`. Source code, types,
lint rules, and CI are authoritative when they can encode a rule. Git holds history;
these pages describe the system as it is now.

## Principles

1. Encode constraints in types, lint, tests, or CI before documenting them.
2. Follow each platform's conventions. Share code where behavior aligns; split it
   where iOS and Android genuinely differ.
3. Treat the platform, not the retired Flutter UI, as the design reference.
4. Write an ADR only for a decision that is expensive to reverse and whose rationale
   will matter later. Fix local implementation choices without an ADR.
5. Keep Flutter maintenance to security and critical fixes during migration.

## Structure

- Routes in `src/app/` are thin entrypoints over feature UI.
- Features live in `src/features/<feature>/<layer>/`. Typical layers are `data`,
  `store`, `form`, and `ui`; a feature creates only the layers it needs.
- Shared infrastructure is reached through owned seams such as `@/db`, `@/storage`,
  `@/firebase`, and `@/components/chrome`.
- Sublayers import sibling sublayer barrels, never their own feature barrel.
- Cross-feature dependencies use public barrels and must keep the dependency graph
  acyclic. ESLint enforces the detailed boundaries.

## Reference

| Topic | Document |
| --- | --- |
| Runtime and native baseline | [runtime.md](./runtime.md) |
| Navigation | [navigation.md](./navigation.md) |
| API and query data | [data.md](./data.md) |
| Local persistence | [storage.md](./storage.md) |
| Lint and formatting | [lint-format.md](./lint-format.md) |
| Testing and completion checks | [testing.md](./testing.md), [definition-of-done.md](./definition-of-done.md) |
| Internationalization | [i18n.md](./i18n.md) |
| Accessibility | [accessibility.md](./accessibility.md) |
| Theme and native chrome | [theming.md](./theming.md) |
| Firebase and push | [firebase.md](./firebase.md) |
| EAS distribution | [eas.md](./eas.md) |
| Release operations | [../releases/README.md](../releases/README.md) |
| Calendar rendering and sync | [calendar.md](./calendar.md) |
| Feature map | [features.md](./features.md) |
| Architectural decisions | [decisions/README.md](./decisions/README.md) |

For a new feature, use [golden-path.md](./golden-path.md). Update a topical page
when its current contract changes. Record Architecture Book rule changes in
[CHANGELOG.md](./CHANGELOG.md); Git retains the implementation history and detailed diffs.
