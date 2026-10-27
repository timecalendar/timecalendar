**For:** the owner of the preprod and production backends (database feature-flag rows, the
platform repo's server values, and write access to the public buckets are outside the repository
and outside the pipeline's reach).

# Export guide fails on preprod: feature flag off and guide images missing

## What I need

1. Enable the `export-guides-v1` feature flag on preprod (and on production when the guide should
   ship). The flag is a database row read by `database-feature-flag.provider.ts`.
2. Upload the initial guide images to the preprod and production public buckets under
   `/export-guides/2026-09-07.1/{en,fr}/...`. The key list and the source files are in
   `server/src/modules/export-guide/data/initial-export-guide-assets.ts:10-31` (files in the
   server's packaged asset directory). The dev bucket already has them.
3. Confirm that `S3_PUBLIC_BUCKET_CLIENT_URL` in the platform repo's values is
   `https://timecalendar-preprod-public.fra1.digitaloceanspaces.com` on preprod and
   `https://timecalendar-public.fra1.digitaloceanspaces.com` on production. Change
   `ds-5-5-school-group-provider-guide` adds exactly these two origins to the app's compiled
   allow-list (`mobile/src/features/export-guides/data/constants.ts`); a different value still
   blocks the guide.

## Why

On preprod the onboarding guide page shows "We couldn't load the export guide". Read-only probes on
2026-10-27:

| Request | Response |
| --- | --- |
| `GET https://preprod-api.timecalendar.app/v1/export-guides?locale=en&clientSchema=1` (also `fr`, also `&catalogueVersion=2026-09-07.1`, which is what the guide page sends) | `503 {"message":"Export guide catalogue unavailable","error":"Service Unavailable"}` |
| same on `https://api-v2.timecalendar.app` | `503`, same body |
| `GET https://preprod-api.timecalendar.app/feature-flags/evaluate?keys=export-guides-v1` | `{"export-guides-v1":false}`; production returns the same |
| `GET https://preprod-api.timecalendar.app/schools` | 200; schools reference `catalogueVersion "2026-09-07.1"`; logos on `timecalendar-preprod-public` |
| `HEAD https://<bucket>.fra1.digitaloceanspaces.com/export-guides/2026-09-07.1/en/ade/groups.png` | `timecalendar-dev-public` 200, `timecalendar-preprod-public` 403, `timecalendar-public` 403 |

`ExportGuideService.get` throws the 503 when the flag is off
(`server/src/modules/export-guide/services/export-guide.service.ts:42-53`). `/schools` succeeds and
needs the export-guide snapshot, so the catalogue itself is loaded; the flag is the cause. The app
maps the 503 to an `http` failure (`mobile/src/features/export-guides/data/repository.ts:226`) and,
with no cached catalogue, shows the blocking state with Retry and Back as specified.

Missing images do not block (each page degrades to a text placeholder), but every page would show
"Instructional image unavailable".

The same blocking screen says "Check your connection and try again." for a server-side 503. The
copy does not depend on the failure class. Changing that is a product decision; nothing is planned.

## How to verify

- `curl -s "https://preprod-api.timecalendar.app/feature-flags/evaluate?keys=export-guides-v1"`
  returns `{"export-guides-v1":true}`.
- `curl -s -o /dev/null -w "%{http_code}" "https://preprod-api.timecalendar.app/v1/export-guides?locale=fr&clientSchema=1&catalogueVersion=2026-09-07.1"`
  returns `200`, and every `url` in the body starts with the preprod bucket origin.
- `curl -sI https://timecalendar-preprod-public.fra1.digitaloceanspaces.com/export-guides/2026-09-07.1/en/ade/groups.png`
  returns 200.
- On a preview build pointed at preprod, choosing a listed school and completing its Programme and
  Connect steps reaches guide page 1 with its image, and Next walks to manual import.

## Blocks

The export guide on preprod and production. Nothing in the repository waits on it; change
`ds-5-5-school-group-provider-guide` ships the client side.
