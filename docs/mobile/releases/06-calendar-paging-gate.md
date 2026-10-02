# Calendar paging release gate

The native Calendar paging owner may merge to `main` while device work continues. A preview or production store binary, or an OTA update carrying it, must not reach users until [E07 release evidence](../../projects/calendar-native-paging/evidence/E07-release.md) covers the **exact source revision** and contains the owner's go verdict. A green PR or a pass on a different commit is insufficient. Review the installed binary's build identity and the JavaScript revision delivered by OTA separately.

Before building or publishing, the release operator records:

1. The full candidate git SHA, CI result, profile, channel, native fingerprint, and intended audience.
2. The Android APK or AAB hash, package/version/build identity, device/OS, and raw 500-crossing and 30-minute soak outputs from that SHA. The PC through `ssh pc`/WSL is the Android build host. The owner's Mac does not run Android release builds.
3. The iOS device run, accessibility and rapid-swipe checks, plus any hitch data available, against the same candidate revision. Unknown metrics remain unknown; they cannot count as passes.
4. The E05/E06 device checks, T14 cleanup status, full Calendar regression, and owner's explicit go/no-go verdict in E07 evidence.

If a candidate changes after evidence collection, rerun affected checks and obtain a verdict for the new revision. Hold distribution while evidence is missing or failed. Building a private perf APK for measurement is separate from publishing a preview binary or OTA.
