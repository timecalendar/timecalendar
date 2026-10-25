# iOS date/time picker uses the device language, not the in-app language

- **Status:** open, low priority (parity gap)
- **Area:** `mobile/src/features/personal-events/ui/date-time-field.tsx` (iOS)

The personal-event form's iOS SwiftUI `DateTimePicker` takes no `locale`, so it renders in the
device language and follows the device 12/24-hour setting. When the in-app language differs from
the device language (for example the app in French on an English device), the picker's month
names and AM/PM read in the device language while the rest of the form reads in French.

Passing the app language does not work: `@expo/ui` applies a `locale` only when Foundation lists
the identifier in `Locale.availableIdentifiers` (`EnvironmentModifier.swift`). Identifiers that
pair the app language with the device region (`fr_US`) or carry an hour cycle
(`fr_FR@hours=h12`) are dropped silently, and a plain `fr_FR` would pin 24-hour time against the
device setting. A simulator check with a composed identifier passed confirmed that the picker
followed the device instead.

Options when this is picked up: an `@expo/ui` change that builds the `Locale` from components
(language, region, hour cycle) instead of checking the identifier list, or a custom picker.
