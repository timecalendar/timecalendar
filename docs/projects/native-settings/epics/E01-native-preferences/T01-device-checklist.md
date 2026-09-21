# T01 owner device acceptance

Record the exact build revision and results for both iOS and Android before release. This evidence
is owner-led and is not a repository merge gate.

- iOS grouped Form and Android continuous Material list use native geometry, insets, ripple, and one
  scroll owner; Router headers and back behavior remain intact.
- System, Light, and Dark update the current page, native controls, dialogs, and navigation, including
  an app/device scheme disagreement.
- Use device language, Français, and English retain one selected choice; current-page labels, dialog
  controls, route titles, and the iOS back-title context translate live.
- Android Cancel, outside tap, and Back dismiss theme/language dialogs without changing preferences.
- Large text grows rows without clipping; screen readers traverse one target per row and announce
  value, switch, selected, action, and navigation semantics distinctly.
- Phone and tablet sizing preserve grouped/list geometry and usable whole-row targets.
- Hub destinations, calendar loading/empty/populated summary, unread badge, and Show weekends state
  remain correct; production hides Environment while authorized variants retain it.
- About prose, value, navigation, and external actions render and act without native-host errors.
