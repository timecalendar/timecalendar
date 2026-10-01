# Android performance harness

Measures Calendar frame timing on a release APK on a real Android device: scripted swipe
chains, vertical scroll and a two-finger pinch, with `dumpsys gfxinfo` frame statistics,
per-thread CPU time, Android view counts and an optional Perfetto trace.

## The perf build

`APP_VARIANT=perf` resolves the development runtime (dev Firebase project, dev-only routes and
the dev-import deep link, cleartext HTTP, OTA disabled) under its own identity, so it installs
beside the `.dev` and store apps:

| | Value |
| --- | --- |
| Application id | `fr.samuelprak.timecalendar.perf` |
| Scheme | `timecalendar-perf` |
| Build type | Gradle `release` (Hermes bytecode, no dev menu, debug-keystore signed) |
| Manifest | `<profileable android:shell="true"/>` |
| Reanimated | `enableReanimatedProfiling` (systrace sections in the C++ core) |

`with-perf-build.js` adds these at prebuild, only when `APP_VARIANT=perf`. No EAS profile sets
that variant, so no store profile can produce this build; `app.config.test.ts` pins every
profile's exact env.

The perf id is not registered in Firebase. The plugin clones the dev Firebase client under the
perf id so the Google Services Gradle plugin accepts it. Crashlytics and Analytics events from
the perf build are not meant to be read.

## Build (Android build host, never the owner's Mac)

Gradle freezes the owner's MacBook. The Windows PC builds inside WSL:

```sh
# From the Mac. Windows OpenSSH runs commands through cmd.exe, so WSL commands go on stdin.
# WSL stops the distro, and the build with it, once no session is attached: hold one open.
ssh pc 'wsl -d Ubuntu -- sleep 7200' &
{ echo "cat > ~/build-apk.sh <<'SCRIPT'"; cat mobile/perf/build-apk.sh; echo SCRIPT
  echo 'chmod +x ~/build-apk.sh'
  echo 'setsid nohup ~/build-apk.sh origin/main > ~/perf-build.log 2>&1 < /dev/null & disown'
} | ssh pc 'wsl -d Ubuntu -- bash -s'
echo 'tail -f ~/perf-build.log' | ssh pc 'wsl -d Ubuntu -- bash -s'
echo 'cat ~/perf-apks/timecalendar-perf-<sha>.apk' | ssh pc 'wsl -d Ubuntu -- bash -s' > /tmp/perf.apk
```

The script checks the ref out in `PERF_REPO` (default `~/Projects/timecalendar-e02`), runs
`npm ci`, `expo prebuild --clean` and `gradlew assembleRelease` for `arm64-v8a`, and copies the
APK to `PERF_OUT` (default `~/perf-apks`). It bakes `EXPO_PUBLIC_API_URL=PERF_API_URL`, default
`http://localhost:3005`, which reaches the Mac's dev backend through `adb reverse`.

## Run (any host with `adb` and Node 24)

```sh
cd mobile
node perf/run.mjs --serial 86fa07cc --apk /tmp/timecalendar-perf-<sha>.apk \
  --seed-token <dev calendar token> --label main-<sha> --out perf/out \
  --probe owned-calendar-pager
```

- `--apk` installs with `adb install -r`. The harness never uninstalls anything.
- `--seed-token` runs `adb reverse tcp:3005 tcp:3005` and opens
  `timecalendar-perf://dev-import?token=…`, which imports and syncs that calendar from the dev
  backend. Seed once per fresh install; the data stays in the app.
- `--url` is the screen under test, default `timecalendar-perf://calendar?focusDate=2026-10-05`.
- `--probe <testID>` reads that node's text or accessibility label through `uiautomator dump`
  before and after each scenario, to check where a swipe chain landed.
- `--logcat <regex>` clears logcat before each scenario and saves the matching `ReactNativeJS`
  lines to `raw/<scenario>-logcat.txt`.
- `--scenarios a,b` runs a subset; `--trace` records a Perfetto trace per scenario with
  `perfetto.pbtx` into `raw/<scenario>.pftrace` (open it in ui.perfetto.dev).

The phone must be unlocked. Each run force-stops the app, starts its launcher activity cold
(`Cold launch TotalTime`) and then opens `--url`. A cold start directly into a deep link crashes
current main with "Attempted to navigate before mounting the Root Layout component".

## Scenarios

Each scenario is one `/system/bin/hid` script (`lib/gestures.mjs`): it registers a virtual HID
multi-touch screen through uhid, plays the touches with millisecond delays and removes the device.
The shell cannot write the real touchscreen's evdev node (SELinux, Android 15), `adb shell input`
has a single pointer, and monkey's injected drags do not move React Native scroll views. The
achieved gesture time in the summary is measured on the host and includes about 300 ms of `hid`
start-up.

Swipes are 150 ms. A 90 ms flick does not page the current PagerView calendar at all, which would
measure the injector rather than the pager.

| Scenario | Gesture |
| --- | --- |
| `swipe-forward-20` | 20 right-to-left swipes, 150 ms each, the next touch 150 ms after lift-off |
| `swipe-back-20` | the same, left to right |
| `fling-5` | 5 forward swipes, 900 ms between them, each settling |
| `vertical-scroll` | 6 alternating vertical flings |
| `reversal-10` | 10 forward-then-back pairs, each touch 120 ms after the previous lift-off; lands where it started (opt-in) |
| `diagonal-20` | 20 forward swipes at 30° from horizontal, 1.2 s apart; the pages travelled count the swipes the pager won over the vertical scroll (opt-in) |
| `pinch-3s` | one two-finger pinch: spread over 1.5 s, close over 1.5 s |

## Output

`<out>/<label>/summary.md` and `summary.json`, plus `raw/` with every `gfxinfo` dump and both
`meminfo` dumps.

- **Frame statistics** come from the `gfxinfo` histogram, which covers every frame since the
  scenario's `reset`. HWUI buckets truncate to whole milliseconds, so `≤16 ms` stands for the
  16.7 ms deadline at 60 Hz and `>33 ms` counts frames over two vsyncs. `Janky (HWUI)` is the
  platform's own janky-frame percentage.
- **`lastFrames`** in the JSON splits the last 120 frames (the `framestats` buffer) into UI
  thread traversal and RenderThread time.
- **Thread CPU** is on-CPU time per thread from `/proc/<pid>/task/*/schedstat` during the
  scenario. `mqt_v_js` is the JavaScript thread; work there during a pinch or a fling is JS work
  on the gesture path.
- **Views** counts the Android views in the activity's hierarchy from `dumpsys activity top`, after
  launch and after all scenarios. The `Views:` line of `dumpsys meminfo` needs a debuggable app.

## Samples

`samples/` holds the `summary.md` and `summary.json` of committed runs, one folder per label. Each
names its revision in the label. The raw dumps stay out of the repository: `gfxinfo` prints window
and package paths that the disclosure scan rejects.

- `main-a922a6e2`: the Calendar of `main` at a922a6e2 (PagerView renderer), seeded with a
  588-event dev calendar (about 17 events a week), week mode, OnePlus 6 on Android 15 at 60 Hz.
