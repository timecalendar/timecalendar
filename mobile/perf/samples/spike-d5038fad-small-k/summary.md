# spike-d5038fad-small-k

- Device: ONEPLUS A6003, Android 15, 60 Hz, Physical size: 1080x2280, Physical density: 450
- Package: fr.samuelprak.timecalendar.perf 4.0.0
- URL: timecalendar-perf://dev-paging-spike?k=small
- Recorded: 2026-10-01T22:49:03.294Z
- Cold launch TotalTime: 7507 ms
- Android views in the activity: 665 after launch, 693 after all scenarios

| Scenario | Frames | p50 ms | p95 ms | p99 ms | Max ms | ≤16 ms | >33 ms | Janky (HWUI) | Gesture ms (achieved/planned) | Probe before → after | Thread CPU ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swipe-forward-20 | 300 | 16 | 40 | 57 | 77 | 50.7% | 25 | 12.33% | 7132/5858 | settled=2026-09-28 page=0 base=0 pph=60 cross=0 settle=0 rebase=0 pageMounts=0 commit=0.0/0.0ms → settled=2027-01-11 page=15 base=15 pph=60 cross=15 settle=2 rebase=2 pageMounts=19 commit=31.5/65.3ms | mecalendar.perf 3469.4, RenderThread 2511.8, mqt_v_js 2067, Jit thread pool 184.9 |
| swipe-back-20 | 296 | 15 | 36 | 57 | 65 | 67.9% | 17 | 12.16% | 7111/5858 | settled=2027-01-11 page=15 base=15 pph=60 cross=15 settle=2 rebase=2 pageMounts=19 commit=31.5/65.3ms → settled=2026-09-28 page=0 base=0 pph=60 cross=30 settle=4 rebase=4 pageMounts=34 commit=22.6/65.3ms | mecalendar.perf 3165.1, RenderThread 2419.9, mqt_v_js 1987.3, Jit thread pool 106.5 |
| fling-5 | 217 | 21 | 38 | 48 | 48 | 21.7% | 16 | 9.22% | 5649/4358 | settled=2026-09-28 page=0 base=0 pph=60 cross=30 settle=4 rebase=4 pageMounts=34 commit=22.6/65.3ms → settled=2026-11-02 page=5 base=0 pph=60 cross=35 settle=9 rebase=4 pageMounts=40 commit=40.6/65.3ms | mecalendar.perf 2781, mqt_v_js 2144.5, RenderThread 2028.4, HeapTaskDaemon 143.1 |
| pinch-3s | 143 | 20 | 31 | 44 | 46 | 19.6% | 4 | 6.99% | 4262/3008 | settled=2026-11-02 page=5 base=0 pph=60 cross=35 settle=9 rebase=4 pageMounts=40 commit=40.6/65.3ms → settled=2026-11-02 page=5 base=0 pph=47 cross=35 settle=9 rebase=4 pageMounts=40 commit=40.6/65.3ms | mecalendar.perf 2288.6, RenderThread 1010.4, mqt_v_js 393.3, pool-7-thread-1 43.2 |
