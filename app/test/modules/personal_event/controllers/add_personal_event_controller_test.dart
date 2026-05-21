import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/personal_event/controllers/add_personal_event_controller.dart';
import 'package:timecalendar/modules/personal_event/models/personal_event.dart';
import 'package:timecalendar/modules/personal_event/states/add_personal_event_form_state.dart';

import '../../../support/settings_provider.dart';

/// Colour converter that returns its input unchanged — lets `buildEvent`
/// tests assert the colour branch without a real `SettingsProvider`.
Color _identity(Color color) => color;

PersonalEvent _buildEvent({
  String uid = 'evt-1',
  String title = 'Original title',
  Color color = const Color(0xFF2196F3),
  DateTime? startsAt,
  DateTime? endsAt,
  String? location = 'Room A',
  String? description = 'Original description',
}) {
  return PersonalEvent(
    (event) => event
      ..uid = uid
      ..title = title
      ..color = color
      ..startsAt = startsAt ?? DateTime(2026, 1, 15, 9, 0)
      ..endsAt = endsAt ?? DateTime(2026, 1, 15, 10, 30)
      ..location = location
      ..description = description
      ..exportedAt = DateTime(2026, 1, 1),
  );
}

/// Reads the controller while keeping its `autoDispose` provider alive for the
/// duration of the test.
({
  AddPersonalEventController controller,
  AddPersonalEventFormState Function() readState,
})
_setUp(PersonalEvent? event) {
  final container = ProviderContainer();
  addTearDown(container.dispose);
  final provider = addPersonalEventControllerProvider(event);
  container.listen(provider, (_, __) {});
  return (
    controller: container.read(provider.notifier),
    readState: () => container.read(provider),
  );
}

void main() {
  group('AddPersonalEventController.build', () {
    test('add mode starts from empty defaults', () {
      final state = _setUp(null).readState();

      expect(state.title, '');
      expect(state.location, '');
      expect(state.description, '');
      expect(state.color, Colors.pink);
      expect(state.colorChanged, isFalse);

      final today = DateTime.now();
      expect(state.date.year, today.year);
      expect(state.date.month, today.month);
      expect(state.date.day, today.day);
    });

    test('edit mode seeds the form from the event', () async {
      await loadSettingsProvider();
      final event = _buildEvent();

      final state = _setUp(event).readState();

      expect(state.title, 'Original title');
      expect(state.location, 'Room A');
      expect(state.description, 'Original description');
      expect(state.date, event.startsAt);
      expect(state.timeStart, const TimeOfDay(hour: 9, minute: 0));
      expect(state.timeEnd, const TimeOfDay(hour: 10, minute: 30));
      expect(state.color, const Color(0xFF2196F3));
      expect(state.colorChanged, isFalse);
    });
  });

  group('setters', () {
    test('field setters update the matching field', () {
      final harness = _setUp(null);

      harness.controller.setTitle('Lunch');
      harness.controller.setLocation('Canteen');
      harness.controller.setDescription('With the team');
      harness.controller.setDate(DateTime(2026, 3, 4));
      harness.controller.setTimeStart(const TimeOfDay(hour: 8, minute: 15));
      harness.controller.setTimeEnd(const TimeOfDay(hour: 9, minute: 45));

      final state = harness.readState();
      expect(state.title, 'Lunch');
      expect(state.location, 'Canteen');
      expect(state.description, 'With the team');
      expect(state.date, DateTime(2026, 3, 4));
      expect(state.timeStart, const TimeOfDay(hour: 8, minute: 15));
      expect(state.timeEnd, const TimeOfDay(hour: 9, minute: 45));
    });

    test('setColor updates the colour and flips colorChanged', () {
      final harness = _setUp(null);
      expect(harness.readState().colorChanged, isFalse);

      harness.controller.setColor(Colors.teal);

      expect(harness.readState().color, Colors.teal);
      expect(harness.readState().colorChanged, isTrue);
    });
  });

  group('isEndAfterStart', () {
    test('is true when the end is after the start', () {
      final harness = _setUp(null);
      harness.controller.setTimeStart(const TimeOfDay(hour: 9, minute: 0));
      harness.controller.setTimeEnd(const TimeOfDay(hour: 10, minute: 0));

      expect(harness.readState().isEndAfterStart, isTrue);
    });

    test('is false when the end equals the start', () {
      final harness = _setUp(null);
      harness.controller.setTimeStart(const TimeOfDay(hour: 9, minute: 30));
      harness.controller.setTimeEnd(const TimeOfDay(hour: 9, minute: 30));

      expect(harness.readState().isEndAfterStart, isFalse);
    });

    test('is false when the end is before the start', () {
      final harness = _setUp(null);
      harness.controller.setTimeStart(const TimeOfDay(hour: 11, minute: 0));
      harness.controller.setTimeEnd(const TimeOfDay(hour: 10, minute: 0));

      expect(harness.readState().isEndAfterStart, isFalse);
    });
  });

  group('buildEvent', () {
    test('add mode builds a new event with a fresh uid', () {
      final controller = _setUp(null).controller;
      controller.setTitle('Standup');
      controller.setLocation('Room 2');
      controller.setDescription('Daily');
      controller.setDate(DateTime(2026, 4, 1));
      controller.setTimeStart(const TimeOfDay(hour: 9, minute: 0));
      controller.setTimeEnd(const TimeOfDay(hour: 9, minute: 30));
      controller.setColor(const Color(0xFF112233));

      final event = controller.buildEvent(_identity);

      expect(event.uid, isNotEmpty);
      expect(event.title, 'Standup');
      expect(event.location, 'Room 2');
      expect(event.description, 'Daily');
      expect(event.startsAt, DateTime(2026, 4, 1, 9, 0));
      expect(event.endsAt, DateTime(2026, 4, 1, 9, 30));
      expect(event.color, const Color(0xFF112233));
    });

    test(
      'add mode applies the converter even when the colour was untouched',
      () {
        final harness = _setUp(null);
        harness.controller.setTitle('Quick note');
        harness.controller.setTimeStart(const TimeOfDay(hour: 14, minute: 0));
        harness.controller.setTimeEnd(const TimeOfDay(hour: 15, minute: 0));
        expect(harness.readState().colorChanged, isFalse);

        final event = harness.controller.buildEvent(
          (_) => const Color(0xFF445566),
        );

        expect(event.color, const Color(0xFF445566));
      },
    );

    test(
      'edit mode keeps the original colour when it was not changed',
      () async {
        await loadSettingsProvider();
        final event = _buildEvent(color: const Color(0xFFABCDEF));
        final controller = _setUp(event).controller;

        controller.setTitle('Renamed');
        // The converter would change the colour — assert it is NOT applied.
        final built = controller.buildEvent((_) => Colors.black);

        expect(built.uid, 'evt-1');
        expect(built.title, 'Renamed');
        expect(built.color, const Color(0xFFABCDEF));
      },
    );

    test(
      'edit mode applies the converter once the colour was changed',
      () async {
        await loadSettingsProvider();
        final controller = _setUp(_buildEvent()).controller;

        controller.setColor(const Color(0xFF010203));
        final built = controller.buildEvent((_) => const Color(0xFF999999));

        expect(built.uid, 'evt-1');
        expect(built.color, const Color(0xFF999999));
      },
    );
  });
}
