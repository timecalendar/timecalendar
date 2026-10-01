## ADDED Requirements

### Requirement: Calendar zoom is classified as environment-independent storage

The central MMKV key inventory SHALL include `settings.calendarZoomPixelsPerHour` and classify it as environment-independent. Backend reset SHALL preserve its numeric value alongside Calendar view and Show weekends, while unknown keys SHALL remain backend-bound. Calendar and Settings feature code SHALL access it only through typed preference and `@/storage` seams and SHALL NOT import the MMKV backend directly.

#### Scenario: Backend reset preserves zoom
- **WHEN** a valid non-default zoom is stored and backend-bound values are cleared
- **THEN** the zoom value remains unchanged
- **AND** backend-bound and unknown values are removed according to the existing reset contract

#### Scenario: Classification coverage includes zoom
- **WHEN** storage key inventory tests enumerate every known key
- **THEN** the zoom key has the explicit environment-independent classification
- **AND** removing that classification fails the coverage test

#### Scenario: Feature access stays behind owned seams
- **WHEN** Calendar reads, changes, or resets zoom
- **THEN** it uses the Settings preference API backed by numeric helpers from `@/storage`
- **AND** no Calendar feature file imports `react-native-mmkv`
