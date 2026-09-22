# Timed-event native accessibility probe

This probe is available only in the development app variant. It runs the existing Calendar route and renderer with fabricated events at 01:00, 10:00, and 23:00, plus tied, overlapping, and minimum-target cases. Its diagnostic lines contain only fixture identity, chronological ordinal, target frame, and routed UID.

Run all commands from `mobile/`. Use the device name accepted by Expo for `build`; use the Android serial or iOS device identifier for the other actions.

## Prepare and launch

1. Reset the development app. Android: `./scripts/accessibility-probe.sh android reset <serial>`. iOS: `./scripts/accessibility-probe.sh ios reset <device-id>`.
2. Build, install, and start the development client. Android: `./scripts/accessibility-probe.sh android build <device-name>`. iOS: `./scripts/accessibility-probe.sh ios build <device-name>`.
3. Keep Metro running from the build command. If it stops, run `npm start` and reconnect the installed development client.
4. Launch the fixture. Android: `./scripts/accessibility-probe.sh android launch <serial>`. iOS: run `./scripts/accessibility-probe.sh ios launch <device-id>` and open the printed URL in Safari on that device.
5. If Calendar opens in Agenda, use the existing view menu to choose Day. Confirm the visible date is 15 June 2026 and the initial viewport contains the 10:00 fixtures while 01:00 and 23:00 begin offscreen.
6. Capture content-free diagnostics while testing. Android: `./scripts/accessibility-probe.sh android logs <serial>`. iOS: `./scripts/accessibility-probe.sh ios logs <device-id>`, then relaunch the fixture URL.

## Native pass

On the exact installed commit, record the device model, OS version, build kind, and commit. Run VoiceOver or TalkBack, Voice Control where available, and Switch Control or Switch Access. Traverse every event once; reach both offscreen extremes; exercise the existing page and zoom controls; change Day/Week mode; activate ordinary, overlap, and tiny events; and record the emitted target frame/order and routed UID. Repeat with the largest supported text size.

After each platform, stop the log command and run the matching `reset` command. An iOS reset uninstalls the development app, so the next pass starts again with `ios build`. Do not infer a platform result from host tests or from the other platform.
