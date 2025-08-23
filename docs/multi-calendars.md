# Feature PRD: Support Multiple UserCalendars

## Introduction
Currently, TimeCalendar allows users to import and display only one UserCalendar (iCal) at a time. This limitation restricts students who wish to view multiple schedules (e.g., personal, school, extracurricular) simultaneously. This feature aims to enable users to manage, display, and interact with multiple UserCalendars within the app.

## Problem Statement
Users can only import and view a single calendar. This prevents them from overlaying or toggling between different schedules, which is a common need for students managing various commitments.

## Solution/Feature Overview
- Allow users to import, store, and manage multiple UserCalendars.
- Provide a UI to list all imported UserCalendars.
- Enable users to toggle the visibility of each calendar (show/hide on the main calendar view).
- Allow users to delete any UserCalendar from their list.
- Associate each CalendarEvent with a specific UserCalendar, so events are managed per calendar.

## User Stories
- **As a user, I want to see a list of all my imported calendars so that I can manage them easily.**
- **As a user, I want to enable or disable the display of each calendar so that I can customize my calendar view.**
- **As a user, I want to delete a calendar I no longer need so that my list stays relevant.**
- **As a user, I want to see only the events for the calendars I have enabled, and for events to be correctly grouped by their source calendar.**

## Acceptance Criteria
- Users can view a list of all imported UserCalendars on a dedicated page.
- Each UserCalendar in the list has a checkbox (or toggle) to enable/disable its display on the main calendar.
- Users can delete any UserCalendar from the list.
- The main calendar view updates in real time to reflect enabled/disabled calendars.
- Deleting a UserCalendar removes it from both the list and the main calendar view.
- The UI clearly distinguishes between enabled and disabled calendars.
- Each CalendarEvent is associated with a UserCalendar, and event storage, retrieval, and deletion are performed per UserCalendar.

## Constraints
- The app must support at least 10 UserCalendars per user.
- Changes to calendar visibility or deletion must be reflected immediately in the UI.
- No external cloud services for calendar storage (local or existing backend only).
- Event storage must support associating each event with its UserCalendar, and CRUD operations must not affect events from other calendars.

## Technical Requirements
- Update the data model to support storing multiple UserCalendars per user.
- Add an association between `CalendarEvent` and `UserCalendar` (e.g., a `userCalendarId` field in `CalendarEvent`).
- Refactor import logic to add new calendars without deleting existing ones.
- Refactor event storage so that events are stored and managed per UserCalendar.
- Update `setCalendarEvents` to only delete and set events for the specified UserCalendar, not all events.
- Implement a page to list, enable/disable, and delete UserCalendars.
- Ensure calendar rendering logic supports overlaying multiple enabled calendars.
- Maintain compatibility with existing calendar import and notification features.
- Use consistent UI patterns for toggles, lists, and delete actions.

## Implementation Checklist: Support Multiple UserCalendars

Please update the implementation checklist once you finished the implementation.

- [x] **Model**
  - [x] Add `visible` property to `UserCalendar` model.
  - [x] Update serialization/deserialization for new property. Make sure backward compatibility is maintained by keeping old ones visible.
  - [ ] Add association between `CalendarEvent` and `UserCalendar` (e.g., `userCalendarId` field).
  - [ ] Update serialization/deserialization for new association.
- [x] **Repository**
  - [x] Refactor `UserCalendarRepository` for CRUD operations.
  - [x] Remove single-calendar overwrite logic.
  - [x] Ensure async DB operations for all methods.
  - [ ] Refactor `CalendarEventRepository` to support CRUD operations per UserCalendar.
  - [ ] Update `setCalendarEvents` to only delete and set events for the specified UserCalendar, not all events.
- [ ] **Provider**
  - [ ] Ensure `userCalendarsProvider` exposes a list of calendars.
  - [ ] Add methods for toggling visibility and deleting calendars.
  - [ ] Ensure state updates trigger UI refresh.
  - [ ] Ensure event providers fetch and update events per UserCalendar.
- [ ] **Service (Optional)**
  - [ ] Implement service for business logic if needed.
  - [ ] Coordinate event CRUD per UserCalendar as needed.
- [ ] **UI**
  - [ ] Create management screen for listing calendars.
  - [ ] Add toggle/checkbox for each calendar's visibility.
  - [ ] Add delete button for each calendar.
  - [ ] Ensure real-time UI updates.
  - [ ] Update main calendar view to overlay enabled calendars.
  - [ ] Ensure events are displayed per enabled UserCalendar.
- [ ] **Widgets**
  - [ ] Create/update reusable widgets for calendar items, toggles, and delete actions.
  - [ ] Create/update widgets to display events grouped by UserCalendar if needed.
- [ ] **Helpers/Controllers**
  - [ ] Update event aggregation logic for multiple enabled calendars.
  - [ ] Update helpers to aggregate/filter events by their associated UserCalendar.
- [ ] **Testing**
  - [ ] Unit tests for repository and provider.
  - [ ] Widget tests for UI and event overlay.
  - [ ] Test event CRUD and display per UserCalendar.
- [ ] **Documentation**
  - [ ] Update documentation for new model, repository, and UI flows.
  - [ ] Document event association with UserCalendar and per-calendar event management.


## Implementation Plan: Support Multiple UserCalendars

### 1. **Model Updates**
- **UserCalendar Model**
  - Ensure the `UserCalendar` model supports all required fields for multiple calendars.
  - Add a `visible` (bool) property to track whether a calendar is enabled/disabled for display.
  - Ensure serialization/deserialization includes the new property.
- **CalendarEvent Model**
  - Add a `userCalendarId` (or similar) property to associate each event with its source UserCalendar.
  - Update serialization/deserialization to include this property.

### 2. **Repository Refactor**
- **UserCalendarRepository**
  - Refactor to support CRUD operations for multiple calendars:
    - `addUserCalendar(UserCalendar calendar)`
    - `deleteUserCalendar(String id)`
    - `updateUserCalendar(UserCalendar calendar)`
    - `getUserCalendars()`
  - Remove logic that deletes all calendars when adding a new one.
  - Ensure all operations are asynchronous and update the local database accordingly.
- **CalendarEventRepository**
  - Refactor to support CRUD operations per UserCalendar.
  - Update `setCalendarEvents(List<CalendarEvent> events, String userCalendarId)` to only delete and set events for the specified UserCalendar, not all events.
  - Ensure that deleting a UserCalendar also deletes its associated events.

### 3. **Provider Setup**
- **userCalendarsProvider**
  - Ensure the provider exposes a list of `UserCalendar` objects.
  - Add methods to update visibility and delete calendars.
  - Ensure state updates trigger UI refreshes.
- **CalendarEventsProvider**
  - Expose events per UserCalendar, and update state only for the relevant calendar.

### 4. **Service Layer (Optional)**
- **UserCalendarService**
  - (If business logic is needed) Implement a service to coordinate repository actions, such as toggling visibility or handling import workflows.
  - Coordinate event CRUD per UserCalendar as needed.

### 5. **UI Development**
- **New Screen: UserCalendars Management**
  - Create a screen to list all imported calendars.
  - For each calendar:
    - Show its name and details.
    - Add a toggle/checkbox for visibility.
    - Add a delete button.
  - Ensure UI updates in real time when calendars are toggled or deleted.
- **Main Calendar View**
  - Update to overlay events from all enabled calendars.
  - Ensure disabling a calendar hides its events immediately.
  - Display events per their associated UserCalendar.

### 6. **Widget Updates**
- **Reusable Widgets**
  - Create or update widgets for calendar list items, toggles, and delete actions.
  - Ensure widgets are modular and reusable.
  - Create/update widgets to display events grouped by UserCalendar if needed.

### 7. **Helpers/Controllers**
- **Event Aggregation**
  - Update helpers to aggregate and filter events from all enabled calendars for display.
  - Ensure aggregation logic respects the UserCalendar association.

### 8. **Testing**
- **Unit and Widget Tests**
  - Test repository CRUD operations.
  - Test provider state changes.
  - Test UI for listing, toggling, and deleting calendars.
  - Test event overlay logic.
  - Test event CRUD and display per UserCalendar.

### 9. **Documentation**
- **Update Docs**
  - Document the new data model, repository methods, and UI flows.
  - Document the association between CalendarEvent and UserCalendar, and per-calendar event management.

