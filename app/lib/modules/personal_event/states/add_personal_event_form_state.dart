import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'add_personal_event_form_state.freezed.dart';

/// Immutable state of the add/edit personal-event form.
@freezed
abstract class AddPersonalEventFormState with _$AddPersonalEventFormState {
  factory AddPersonalEventFormState({
    required String title,
    required String location,
    required String description,
    required DateTime date,
    required TimeOfDay timeStart,
    required TimeOfDay timeEnd,
    required Color color,
    @Default(false) bool colorChanged,
  }) = _AddPersonalEventFormState;

  AddPersonalEventFormState._();

  /// Whether the end time is strictly after the start time.
  bool get isEndAfterStart =>
      timeStart.hour < timeEnd.hour ||
      (timeStart.hour == timeEnd.hour && timeStart.minute < timeEnd.minute);
}
