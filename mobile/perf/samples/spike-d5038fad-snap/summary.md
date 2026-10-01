# spike-d5038fad-snap

- Device: ONEPLUS A6003, Android 15, 60 Hz, Physical size: 1080x2280, Physical density: 450
- Package: fr.samuelprak.timecalendar.perf 4.0.0
- URL: timecalendar-perf://dev-paging-spike
- Recorded: 2026-10-01T22:47:10.710Z
- Cold launch TotalTime: 7612 ms
- Android views in the activity: 665 after launch, 722 after all scenarios

| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swipe-forward-20 | 325 | 16 | 36 | 44 | 46 | 50.2% | 20 | 12.31% | 7133/5858 | settled=2026-09-28 page=0 base=0 pph=60 cross=0 settle=0 rebase=0 pageMounts=0 commit=0.0/0.0ms → settled=2027-01-18 page=16 base=0 pph=60 cross=16 settle=1 rebase=0 pageMounts=21 commit=43.7/74.9ms | mecalendar.perf 3341, RenderThread 2798.3, mqt_v_js 2046.7, Jit thread pool 161.7 |
| swipe-back-20 | 331 | 17 | 34 | 46 | 65 | 44.4% | 24 | 11.48% | 7095/5858 | settled=2027-01-18 page=16 base=0 pph=60 cross=16 settle=1 rebase=0 pageMounts=21 commit=43.7/74.9ms → settled=2026-09-28 page=0 base=0 pph=60 cross=32 settle=3 rebase=0 pageMounts=37 commit=38.9/74.9ms | mecalendar.perf 3321, RenderThread 2873, mqt_v_js 2350.7, Jit thread pool 102.3 |
| fling-5 | 222 | 18 | 38 | 44 | 57 | 33.3% | 14 | 7.66% | 5602/4358 | settled=2026-09-28 page=0 base=0 pph=60 cross=32 settle=3 rebase=0 pageMounts=37 commit=38.9/74.9ms → settled=2026-11-02 page=5 base=0 pph=60 cross=37 settle=8 rebase=0 pageMounts=42 commit=40.2/74.9ms | mecalendar.perf 2844.4, mqt_v_js 2219.1, RenderThread 2025.1, hades 118.2 |
| reversal-10 | 273 | 16 | 34 | 38 | 40 | 58.2% | 17 | 14.65% | 6539/5288 | settled=2026-11-02 page=5 base=0 pph=60 cross=37 settle=8 rebase=0 pageMounts=42 commit=40.2/74.9ms → settled=2026-11-02 page=5 base=0 pph=60 cross=37 settle=8 rebase=0 pageMounts=61 commit=40.2/74.9ms | mecalendar.perf 2710.9, RenderThread 2185.9, mqt_v_js 1678.1, HeapTaskDaemon 156.5 |
| diagonal-20 | 347 | 15 | 42 | 48 | 57 | 63.4% | 45 | 22.19% | 27058/25808 | settled=2026-11-02 page=5 base=0 pph=60 cross=37 settle=8 rebase=0 pageMounts=61 commit=40.2/74.9ms → settled=2027-03-22 page=25 base=0 pph=60 cross=77 settle=28 rebase=0 pageMounts=82 commit=42.2/74.9ms | mecalendar.perf 6391.5, mqt_v_js 6107.8, RenderThread 2990, hades 533 |
| vertical-scroll | 119 | 20 | 44 | 48 | 53 | 31.9% | 12 | 10.08% | 5010/3728 | settled=2027-03-22 page=25 base=0 pph=60 cross=77 settle=28 rebase=0 pageMounts=82 commit=42.2/74.9ms → settled=2027-03-22 page=25 base=0 pph=60 cross=77 settle=28 rebase=0 pageMounts=82 commit=42.2/74.9ms | RenderThread 1507.6, mecalendar.perf 1034.8, mqt_v_js 173.5, Profile Saver 67.8 |
| pinch-3s | 143 | 19 | 30 | 44 | 46 | 12.6% | 6 | 6.29% | 4271/3008 | settled=2027-03-22 page=25 base=0 pph=60 cross=77 settle=28 rebase=0 pageMounts=82 commit=42.2/74.9ms → settled=2027-03-22 page=25 base=0 pph=47 cross=77 settle=28 rebase=0 pageMounts=82 commit=42.2/74.9ms | mecalendar.perf 2303.9, RenderThread 993.4, mqt_v_js 467, HeapTaskDaemon 170.2 |
