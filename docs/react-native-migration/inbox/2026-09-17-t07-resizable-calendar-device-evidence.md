# T07 resizable Calendar — exact-build device evidence

`(HUMAN: compatible binary and physical/resizable-window acceptance)`

Host automation proves the source configuration, disposable generated-native contracts, pure
geometry and cancellation behavior. This host has no supported simulator/emulator or signing
authority, so it does not claim rotation, multitasking, native gesture feel, or platform chrome.
Those unexecuted device cells are explicitly deferred to T28; an OTA on the previously accepted
binary is not evidence for this native-policy change.

## Exact-build worksheet

The host-tested runtime revision is `137cc39e8e5fe4ce30800c52c608adb34c6df382`.
Its preview fingerprints are iOS `1fc4682e04c9d0029f21d38e6ed4cf359c6da8f3` and Android
`9ec6cd2ff58e8553743766ff79963abdfb75683e`. Disposable prebuild verification passed at
that revision and independently printed the iPhone and iPad orientation arrays.

- Fresh compatible binary/build identifier: not produced on this host; proposed T28 deferral,
  pending an explicit owner decision.
- Device model, OS, and physical/simulator status: not executed; proposed T28 deferral, pending an
  explicit owner decision.
- Fabricated setup: afternoon schedule at non-default zoom, ready for the device pass.
- Compact, medium, and expanded window dimensions: not executed; proposed T28 deferral, pending an
  explicit owner decision.

A previous binary, JavaScript reload, or OTA is not a compatible exact build. Until an owner
explicitly accepts the proposed T28 deferrals, none of the device-only cells below is recorded as
deferred or passed.

Before owner acceptance, replace the proposed deferrals with one fresh compatible build record:

- exact Git revision and the matching iOS/Android runtime fingerprint;
- binary/build identifier, device model, OS, and physical/simulator status;
- fabricated afternoon schedule at non-default zoom;
- compact, medium, and expanded tested window dimensions.

## Owner checklist

- [ ] Rotate both ways; selected week/day, explicit mode, zoom, and visible clock position survive.
      Outcome: pending; proposed T28 deferral awaiting explicit owner decision.
- [ ] Repeatedly resize a tablet through compact, medium, and expanded windows; complete columns
      and dated headers stay aligned and Week never changes silently to Day. Outcome: pending;
      proposed T28 deferral awaiting explicit owner decision.
- [ ] Rotate or resize during a vertical drag, pager drag, and pinch; old work cancels or settles
      without mixed geometry or a stale date/zoom/offset commit. Outcome: pending; proposed T28
      deferral awaiting explicit owner decision.
- [ ] Open the other tabs and return; shared navigation and native chrome remain usable. Outcome:
      pending; proposed T28 deferral awaiting explicit owner decision.
- [ ] Change height without changing width, then scroll to 24:00; the closing boundary remains
      reachable above automatic native chrome. Outcome: pending; proposed T28 deferral awaiting
      explicit owner decision.
- [ ] Repeat T05 Day/Week paging, weekend preference, Agenda/details access, and T06 pinch plus
      accessible zoom controls; record any regression before acceptance. Outcome: pending;
      proposed T28 deferral awaiting explicit owner decision.

Each item must be marked pass, fail, or T28-deferred against the exact build before acceptance.

## Acceptance record

- Owner acceptance source and date: pending explicit owner acceptance of the exact pull-request
  head and the six checklist outcomes; no reply is not acceptance.
- Reviewer verdict and merged revision: pending after owner acceptance and green checks on that
  exact head.
