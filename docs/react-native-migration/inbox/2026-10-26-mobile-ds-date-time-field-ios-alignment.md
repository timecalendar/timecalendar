**For:** whoever owns the `@/components/chrome` date picker seam (OpenSpec `mobile-ds-text-field`).

# iOS DateTimeField: picker centered under a leading label

## What I need

A decision on how the iOS compact picker in `DateTimeField` lines up with its label and error. It
sits horizontally centered while the label and error above and below it are leading-aligned
(`timecalendar-dev://developer/gallery/date-time-field--default` on an iOS simulator).

## Why it cannot be fixed in `src/design/`

`@expo/ui`'s community `DateTimePicker` renders `<Host matchContents={{ vertical: true }}>`. The
host takes its width from React Native layout, and SwiftUI centers the pills inside it. A
`flex-start` wrapper collapses the host to width 0, and the pills then render half off-screen to
the left (checked on the iPhone 17 Pro simulator, iOS 26.5).

## Proposed fix

In `src/components/chrome/`, render the iOS picker as `Host matchContents={{ vertical: true }}`
plus the SwiftUI `DatePicker` with `frame({ maxWidth: Infinity, alignment: "leading" })`, as an
opt-in so the other consumers keep their layout. The host keeps its full-width proposal, so the
pills still wrap at accessibility text sizes.

## How to verify

`date-time-field--default`, `--error` and `--long-strings` on iOS at the default size and at
`accessibility-extra-extra-extra-large`: the first pill's leading edge lines up with the label, and
no pill is clipped.

## Blocks

Nothing. The field works as it is; this is visual polish.
