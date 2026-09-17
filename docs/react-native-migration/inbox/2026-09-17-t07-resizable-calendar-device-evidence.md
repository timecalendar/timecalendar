# T07 resizable Calendar — exact-build device evidence

`(HUMAN: compatible binary and physical/resizable-window acceptance)`

Host automation proves the source configuration, disposable generated-native contracts, pure
geometry and cancellation behavior. This host has no supported simulator/emulator or signing
authority, so it does not claim rotation, multitasking, native gesture feel, or platform chrome.
Those unexecuted device cells are explicitly deferred to T28; an OTA on the previously accepted
binary is not evidence for this native-policy change.

Before owner acceptance, record one fresh compatible build with:

- exact Git revision and the matching iOS/Android runtime fingerprint;
- binary/build identifier, device model, OS, and physical/simulator status;
- fabricated afternoon schedule at non-default zoom;
- compact, medium, and expanded tested window dimensions.

## Owner checklist

- [ ] Rotate both ways; selected week/day, explicit mode, zoom, and visible clock position survive.
- [ ] Repeatedly resize a tablet through compact, medium, and expanded windows; complete columns
      and dated headers stay aligned and Week never changes silently to Day.
- [ ] Rotate or resize during a vertical drag, pager drag, and pinch; old work cancels or settles
      without mixed geometry or a stale date/zoom/offset commit.
- [ ] Open the other tabs and return; shared navigation and native chrome remain usable.
- [ ] Change height without changing width, then scroll to 24:00; the closing boundary remains
      reachable above automatic native chrome.
- [ ] Repeat T05 Day/Week paging, weekend preference, Agenda/details access, and T06 pinch plus
      accessible zoom controls; record any regression before acceptance.

Each item must be marked pass, fail, or T28-deferred against the exact build before acceptance.
