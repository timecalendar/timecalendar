# Backend environment switch device pass

> (HUMAN: run on supported physical iOS and Android preview/development builds after the source
> change reaches a device-capable build. This checklist is non-blocking on the no-KVM agent host.)

- [ ] Preview starts on preproduction; production has no Environment section and remains production
      after carrying stale local/preproduction MMKV values from an upgrade fixture.
- [ ] Development offers Local, Preproduction and Production; preview offers only Preproduction and
      Production; neither accepts a typed/custom URL.
- [ ] Cancel leaves session/data/environment unchanged. Confirm announces the destructive effect,
      shows progress, clears data and reloads into an empty target state on iOS and Android.
- [ ] Kill the app during reset on each platform. Cold restart blocks normal routes, offers retry,
      completes idempotently and never makes a request with mixed state.
- [ ] The Local/Preproduction marker survives every tab and pushed route, remains screenshot-visible
      under light/dark themes, respects safe areas and is absent in production.
- [ ] VoiceOver and TalkBack announce selector, current value, confirmation, progress, marker,
      recovery alert and retry in sensible order. Largest text does not clip, and controls meet
      44pt iOS / 48dp Android targets.
- [ ] A successful switch appears once in Firebase DebugView with enum-only from/to parameters, and
      Crashlytics carries only the effective environment enum. Cancellation/failure emits no success.

The committed `mobile/.maestro/environment-switch.yaml` covers the ordinary development happy path;
the restart timing, native reload and assistive-technology checks above remain device-only.
