## ADDED Requirements

### Requirement: The checklist Maestro journey observes progress after returning to a summary

The existing `event-checklists.yaml` real-device-local CRUD journey SHALL retain its add, toggle, and delete assertions and SHALL additionally observe the created/toggled checklist state on an event-summary surface after returning through the existing screen stack. The assertion SHALL use the real seeded synced event and real `checklist_items` store, be shared across iOS and Android, and SHALL not weaken or replace the existing CRUD proof.

#### Scenario: Created and toggled progress appears after returning from details

- **WHEN** the flow adds an item to the seeded event, toggles it complete, and returns to an existing Home, Calendar, or Agenda summary surface
- **THEN** that event summary exposes the all-complete `1/1` checklist state
- **AND** the observation fails if progress only updates after leaving and reopening the summary screen

#### Scenario: Existing CRUD proof remains intact

- **WHEN** the extended flow completes
- **THEN** it still proves typed content appears, the checkbox toggle is reflected, and cleanup hard-deletes the item
