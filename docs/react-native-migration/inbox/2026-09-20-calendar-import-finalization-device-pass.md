# Complete calendar import flow device pass

**For:** whoever runs the device passes (physical iOS and Android devices are unavailable on the
implementation host).

## What I need

Run the completed QR and iCal import journey on current iOS and Android development or preview
builds, including recovery and assistive-technology variants.

## Why

Jest proves checkpoint reuse, request exclusion, camera component teardown, root navigation calls,
accessible roles/live regions, and committed-event success classification. It cannot prove the
native camera session, VoiceOver/TalkBack announcements, Dynamic Type geometry, or the actual
native Stack after platform Back/gesture transitions.

## How to verify

- [ ] On iOS and Android, scan a valid QR. Confirm the camera session visibly stops immediately,
      readable import progress replaces it, and repeated camera delivery cannot start another
      request.
- [ ] Force create, token-resolution, and local-persistence failures in turn. Confirm the alert is
      announced, Retry resumes without duplicate calendar creation after a token is known, **Scan
      another** re-arms one camera in place, and switching to iCal makes native Back/gesture return
      to the import-method chooser rather than the failed QR route.
- [ ] Submit a valid iCal URL. Confirm the editable form disappears throughout create, resolve, and
      persistence; repeated taps cannot duplicate the request; failure retains Retry and Report;
      and a materially different URL starts a new attempt.
- [ ] For both sources, confirm durable completion removes onboarding and shows the root loading
      state. Exercise event-fetch and local-event-write failure: the failure announcement is
      assertive, Retry only hydrates events, and Continue opens the existing Calendar tab.
- [ ] Confirm valid empty events and a name-convergence warning both reach the polite success
      announcement. Activate **View my timetable** and verify the final root stack is the existing
      Calendar tab only—no onboarding, result, or duplicate tabs entry—and imported events are
      visible immediately without killing or relaunching the app.
- [ ] From loading, failure, and success, exercise iOS Back gesture / Android system Back and
      confirm onboarding cannot reappear.
- [ ] Repeat the flow with VoiceOver and TalkBack, then largest iOS Dynamic Type and Android font
      size. Confirm loading is announced politely, failure as an alert, success politely; focus
      order is logical; text does not clip; and every control remains at least 44pt/48dp.

## Blocks

Nothing—this is the explicit device-only handoff for the completed source implementation.
