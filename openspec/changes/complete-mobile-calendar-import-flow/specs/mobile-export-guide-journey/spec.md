## ADDED Requirements

### Requirement: Provider selection uses stable compact native chrome
The provider-selection route SHALL mount one short localized native header title before choosing
its loading, blocking-error, or loaded content. The title SHALL remain identical across those
states and SHALL NOT expose a filesystem route segment. The longer provider-selection prompt SHALL
render as the page heading inside the readable content lane rather than as native chrome.

#### Scenario: Loading never exposes the route name
- **WHEN** provider selection is waiting for its catalogue
- **THEN** the native header shows the localized compact export-guide title
- **AND** it does not show `export-guide/providers` or another raw route identifier

#### Scenario: Error and content keep the same title
- **WHEN** provider selection changes from loading to a blocking error or a loaded provider list
- **THEN** the native header title remains unchanged
- **AND** the full provider-selection prompt appears in page content when the list is available

#### Scenario: Compact title has French and English parity
- **WHEN** the route renders in French or English
- **THEN** the compact native title and the body heading resolve from typed keys present in both catalogues

### Requirement: Completed export-guide pages remain navigable
Returning to guide pages after reaching the import chooser SHALL preserve the completed guide and
allow forward navigation. Revisits SHALL NOT reset the draft, visited bound, or completion state,
and SHALL NOT emit a second completion event.

#### Scenario: Back from the chooser does not strand the student
- **WHEN** the student returns from the import chooser to the final guide page
- **THEN** its primary action is enabled and opens the import chooser again
- **AND** guide completion is not recorded a second time

#### Scenario: Earlier completed pages still advance
- **WHEN** the student goes back multiple pages in a completed guide and presses Next
- **THEN** the next already-visited page opens with completion and draft preserved
