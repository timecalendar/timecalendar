import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/personal_event/models/personal_event.dart';
import 'package:timecalendar/modules/personal_event/states/add_personal_event_form_state.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:uuid/uuid.dart';

/// Holds the form state and logic for adding or editing a [PersonalEvent].
///
/// Exposed as an `autoDispose` family keyed by the optional event being
/// edited (`null` when creating a new event), so every screen open starts
/// from freshly-built state.
class AddPersonalEventController extends Notifier<AddPersonalEventFormState> {
  AddPersonalEventController(this.initialEvent);

  /// The event being edited, or `null` when creating a new event.
  final PersonalEvent? initialEvent;

  @override
  AddPersonalEventFormState build() {
    final event = initialEvent;
    if (event != null) {
      return AddPersonalEventFormState(
        title: event.title,
        location: event.location ?? '',
        description: event.description ?? '',
        date: event.startsAt,
        timeStart: TimeOfDay.fromDateTime(event.startsAt),
        timeEnd: TimeOfDay.fromDateTime(event.endsAt),
        color:
            SettingsProvider().getEventColorToDisplay(event.color) ??
            event.color,
        colorChanged: false,
      );
    }

    final start = TimeOfDay.now();
    return AddPersonalEventFormState(
      title: '',
      location: '',
      description: '',
      date: DateTime.now(),
      timeStart: start,
      timeEnd: TimeOfDay(hour: start.hour + 1, minute: 0),
      color: Colors.pink,
      colorChanged: false,
    );
  }

  void setTitle(String value) => state = state.copyWith(title: value);

  void setLocation(String value) => state = state.copyWith(location: value);

  void setDescription(String value) =>
      state = state.copyWith(description: value);

  void setDate(DateTime value) => state = state.copyWith(date: value);

  void setTimeStart(TimeOfDay value) =>
      state = state.copyWith(timeStart: value);

  void setTimeEnd(TimeOfDay value) => state = state.copyWith(timeEnd: value);

  void setColor(Color value) =>
      state = state.copyWith(color: value, colorChanged: true);

  /// Builds the [PersonalEvent] to persist from the current form state.
  ///
  /// [toSaveColor] converts the displayed colour into the colour to store
  /// (dark-mode aware). It is injected so the controller stays decoupled from
  /// `SettingsProvider` and remains unit-testable. The original event's colour
  /// is kept untouched when editing without changing the colour.
  PersonalEvent buildEvent(Color Function(Color) toSaveColor) {
    final form = state;
    final original = initialEvent;

    final startsAt = DateTime(
      form.date.year,
      form.date.month,
      form.date.day,
      form.timeStart.hour,
      form.timeStart.minute,
    );
    final endsAt = DateTime(
      form.date.year,
      form.date.month,
      form.date.day,
      form.timeEnd.hour,
      form.timeEnd.minute,
    );
    final color = (form.colorChanged || original == null)
        ? toSaveColor(form.color)
        : original.color;
    final exportedAt = DateTime.now();

    if (original != null) {
      return original.rebuild(
        (event) => event
          ..title = form.title
          ..description = form.description
          ..color = color
          ..location = form.location
          ..startsAt = startsAt
          ..endsAt = endsAt
          ..exportedAt = exportedAt,
      );
    }

    return PersonalEvent(
      (event) => event
        ..uid = Uuid().v4()
        ..title = form.title
        ..description = form.description
        ..color = color
        ..location = form.location
        ..startsAt = startsAt
        ..endsAt = endsAt
        ..exportedAt = exportedAt,
    );
  }
}

final addPersonalEventControllerProvider = NotifierProvider.autoDispose
    .family<
      AddPersonalEventController,
      AddPersonalEventFormState,
      PersonalEvent?
    >(AddPersonalEventController.new);
