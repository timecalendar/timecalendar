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

## User Stories
- **As a user, I want to see a list of all my imported calendars so that I can manage them easily.**
- **As a user, I want to enable or disable the display of each calendar so that I can customize my calendar view.**
- **As a user, I want to delete a calendar I no longer need so that my list stays relevant.**

## Acceptance Criteria
- Users can view a list of all imported UserCalendars on a dedicated page.
- Each UserCalendar in the list has a checkbox (or toggle) to enable/disable its display on the main calendar.
- Users can delete any UserCalendar from the list.
- The main calendar view updates in real time to reflect enabled/disabled calendars.
- Deleting a UserCalendar removes it from both the list and the main calendar view.
- The UI clearly distinguishes between enabled and disabled calendars.

## Constraints
- The app must support at least 10 UserCalendars per user.
- Changes to calendar visibility or deletion must be reflected immediately in the UI.
- No external cloud services for calendar storage (local or existing backend only).

## Technical Requirements
- Update the data model to support storing multiple UserCalendars per user.
- Refactor import logic to add new calendars without deleting existing ones.
- Implement a page to list, enable/disable, and delete UserCalendars.
- Ensure calendar rendering logic supports overlaying multiple enabled calendars.
- Maintain compatibility with existing calendar import and notification features.
- Use consistent UI patterns for toggles, lists, and delete actions.

## Implementation Checklist: Support Multiple UserCalendars

- [ ] **Model**
  - [ ] Add `visible` property to `UserCalendar` model.
  - [ ] Update serialization/deserialization for new property. Make sure backward compatibility is maintained by keeping old ones visible.
- [ ] **Repository**
  - [ ] Refactor `UserCalendarRepository` for CRUD operations.
  - [ ] Remove single-calendar overwrite logic.
  - [ ] Ensure async DB operations for all methods.
- [ ] **Provider**
  - [ ] Ensure `userCalendarsProvider` exposes a list of calendars.
  - [ ] Add methods for toggling visibility and deleting calendars.
  - [ ] Ensure state updates trigger UI refresh.
- [ ] **Service (Optional)**
  - [ ] Implement service for business logic if needed.
- [ ] **UI**
  - [ ] Create management screen for listing calendars.
  - [ ] Add toggle/checkbox for each calendar's visibility.
  - [ ] Add delete button for each calendar.
  - [ ] Ensure real-time UI updates.
  - [ ] Update main calendar view to overlay enabled calendars.
- [ ] **Widgets**
  - [ ] Create/update reusable widgets for calendar items, toggles, and delete actions.
- [ ] **Helpers/Controllers**
  - [ ] Update event aggregation logic for multiple enabled calendars.
- [ ] **Testing**
  - [ ] Unit tests for repository and provider.
  - [ ] Widget tests for UI and event overlay.
- [ ] **Documentation**
  - [ ] Update documentation for new model, repository, and UI flows.


## Implementation Plan: Support Multiple UserCalendars

### 1. **Model Updates**
- **UserCalendar Model**
  - Ensure the `UserCalendar` model supports all required fields for multiple calendars.
  - Add a `visible` (bool) property to track whether a calendar is enabled/disabled for display.
  - Ensure serialization/deserialization includes the new property.

### 2. **Repository Refactor**
- **UserCalendarRepository**
  - Refactor to support CRUD operations for multiple calendars:
    - `addUserCalendar(UserCalendar calendar)`
    - `deleteUserCalendar(String id)`
    - `updateUserCalendar(UserCalendar calendar)`
    - `getUserCalendars()`
  - Remove logic that deletes all calendars when adding a new one.
  - Ensure all operations are asynchronous and update the local database accordingly.

### 3. **Provider Setup**
- **userCalendarsProvider**
  - Ensure the provider exposes a list of `UserCalendar` objects.
  - Add methods to update visibility and delete calendars.
  - Ensure state updates trigger UI refreshes.

### 4. **Service Layer (Optional)**
- **UserCalendarService**
  - (If business logic is needed) Implement a service to coordinate repository actions, such as toggling visibility or handling import workflows.

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

### 6. **Widget Updates**
- **Reusable Widgets**
  - Create or update widgets for calendar list items, toggles, and delete actions.
  - Ensure widgets are modular and reusable.

### 7. **Helpers/Controllers**
- **Event Aggregation**
  - Update helpers to aggregate and filter events from all enabled calendars for display.

### 8. **Testing**
- **Unit and Widget Tests**
  - Test repository CRUD operations.
  - Test provider state changes.
  - Test UI for listing, toggling, and deleting calendars.
  - Test event overlay logic.

### 9. **Documentation**
- **Update Docs**
  - Document the new data model, repository methods, and UI flows.

