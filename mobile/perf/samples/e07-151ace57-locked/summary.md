# E07 initial soak attempt

The exact `151ace57f7e2b1b9803d7d45ede1794718167d7f` perf APK and installed base APK both had SHA-256 `7845f89a6fd0d67b7bc8c9e5a0722361671baceb066ed49565cce8d44baf3b43`.

This attempt is **invalid environment evidence**. Android was dozing with the keyguard showing and NotificationShade focused. The runner captured at least 28 gestures, no Calendar baseline, zero observed crossings, eight views and zero rendered frames in each of three samples. It was stopped without a final sample. The phone reported AC power while its stay-awake mask covered USB only; the device setting was left unchanged.
