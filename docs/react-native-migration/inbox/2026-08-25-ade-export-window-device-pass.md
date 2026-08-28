# ADE export window — post-deploy device pass

**Date:** 2026-08-25
**Change:** `normalize-ade-export-date-windows`
**For:** Samuel `(HUMAN: physical-device import and later-refresh pass after deployment)`

## What I need

After this server change is deployed, use a legitimate ADE iCal export URL whose explicit
`firstDate`/`lastDate` pair is expired or covers only a narrow period:

1. On a physical iOS or Android device, import the URL as a new calendar.
2. Confirm the import succeeds and current events appear.
3. Keep the imported calendar, wait until its normal server sync interval has elapsed, then
   refresh again and confirm current events still load.
4. Record the university, platform/OS, approximate original date range, import time, and later
   refresh time. Do not record or attach the full URL because it may contain resource ids or
   credentials.

## Why

Server Jest coverage deterministically proves structural URL recognition, rolling date
arithmetic, creation/resync recomputation, unchanged stored sources, representative school
exceptions, and Lyon 1's one-fetch-per-hour cadence. This host has no simulator, and a real
post-deploy ADE endpoint plus physical app is required to confirm the user-visible import path
against a university's live export behavior.

## How to verify

A pass requires the expired or narrow URL to import without editing its dates, current events
to appear, and a later refresh after the normal interval to remain successful. Report only the
university and non-sensitive timing/range evidence; never paste credentials or the complete
export URL into the PR, issue, or this file.

## Blocks

Nothing in this change. The deterministic server behavior is CI-covered; this is the required
post-deploy confirmation of the live, device-visible path.
