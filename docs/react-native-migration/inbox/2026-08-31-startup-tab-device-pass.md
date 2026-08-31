# (HUMAN: startup-tab device pass)

Non-blocking physical-device checks for the configurable startup screen:

- Record first paint for Home and Calendar cold relaunches on iOS and Android;
  confirm no wrong-tab flash.
- Check VoiceOver/TalkBack labels, focus order, and selected state on the row and
  native picker.
- Check large text and the 44pt iOS / 48dp Android targets without clipping.
- Review the platform-native picker feel on supported devices.

Automated iOS/Android Maestro owns the cold-relaunch behavior. Prerequisite
failures are recorded through Firebase. Product analytics is N/A: selecting a
local launch default is neither a funnel nor a server action.
