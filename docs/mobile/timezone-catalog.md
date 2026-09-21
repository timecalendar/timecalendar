# Worldwide time-zone catalog

The mobile chooser imports the bounded generated artifact at
`mobile/src/features/settings/data/timezone-catalog.generated.ts`. It never imports CLDR packages
at runtime.

## Inputs and licenses

- `@vvo/tzdb@6.198.0` — MIT license.
- `cldr-dates-full@48.2.0` — Unicode License v3.
- `cldr-localenames-full@48.2.0` — Unicode License v3.

The generator reads tzdb identifiers, group members, alternative names, countries, and common
cities. From CLDR it reads only English and French `timeZoneNames.json` exemplar cities and
`territories.json` territory labels. The generated records contain those bounded fields and input
version provenance, not license prose or full locale distributions.

## Update procedure

From `mobile/`:

```sh
npm install --save-dev --save-exact @vvo/tzdb@<version> cldr-dates-full@<version> cldr-localenames-full@<version>
npm run generate:timezone-catalog
npm run generate:timezone-catalog -- --check
npm test -- --runInBand src/features/settings/data/timezone-catalog.test.ts
```

Review the generated diff, verify every former curated identifier and representative aliases,
rerun the server validator compatibility table, and then run the mobile gates. Generator output
is deterministic and committed.

## Runtime and downgrade behavior

Catalog membership does not guarantee that an older operating-system `Intl` database supports an
identifier. The chooser visibly disables unavailable records and effective resolution falls back
without deleting stored intent. An older app version likewise falls back from a newer stored value
while leaving the raw compatibility key untouched for a later version to recover.
