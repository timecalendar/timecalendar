## ADDED Requirements

### Requirement: Calendar list presentations use the localized missing-title rule

Agenda and retained Calendar summaries SHALL resolve missing, blank, or non-string event titles at presentation time with `(No title)` in English and `(Sans titre)` in French. The fallback SHALL appear in visible text and the owning accessible event label, while stored rows remain unchanged. Existing Agenda grouping, time/location formatting, checklist meaning, target geometry, refresh behavior, and original-identity activation SHALL remain unchanged.

#### Scenario: Agenda shows the locale-specific fallback

- **WHEN** the same untitled event appears in Agenda under English and French
- **THEN** its row and accessible label use the corresponding localized fallback
- **AND** its date section, time, optional location, checklist, and route identity are preserved

#### Scenario: Existing titled event is unchanged

- **WHEN** a valid Maths event has a usable title
- **THEN** Agenda displays and announces `Maths` rather than the fallback
- **AND** no grouping or activation behavior changes
