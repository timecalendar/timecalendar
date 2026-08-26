## Why

The EAS project has now been initialized and its real, non-secret project ID is committed,
but the authoritative mobile distribution specification still describes the earlier
pre-initialization placeholder state. The release guidance and specification must agree before
the React Native v4 preview workflow can be treated as documented current state.

## What Changes

- Replace the pre-initialization project-ID requirement with the initialized EAS linkage.
- Require a fresh clone to resolve the committed project ID and derived Expo Updates URL without
  an environment variable.
- Preserve `EAS_PROJECT_ID` as an explicit override and keep credentials out of the repository.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-distribution`: Record the initialized EAS project linkage instead of the obsolete
  absent-ID/placeholder state.

## Impact

This updates the authoritative `mobile-distribution` contract to match `mobile/app.config.ts`
and the binding EAS Architecture Book entry. It changes no runtime code, credentials, build,
submission, or rollout behavior.
