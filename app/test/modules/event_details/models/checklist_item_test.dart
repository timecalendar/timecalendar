import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/event_details/models/checklist_item.dart';

void main() {
  group('ChecklistItem', () {
    test('fromMap then toMap round-trips every field', () {
      final map = <String, dynamic>{
        'uuid': 'item-1',
        'eventUid': 'event-1',
        'content': 'Réviser le chapitre 3',
        'isChecked': true,
        'order': 2,
        'createdAt': '2024-01-01T09:00:00.000Z',
        'updatedAt': '2024-01-02T10:30:00.000Z',
        'deletedAt': '2024-01-03T11:45:00.000Z',
      };

      final roundTripped = ChecklistItem.fromMap(map).toMap();

      expect(roundTripped, equals(map));
    });

    test('auto-generates a uuid when none is provided', () {
      final item = ChecklistItem(content: 'Acheter un cahier');

      expect(item.uuid, isNotNull);
      expect(item.uuid, isNotEmpty);
    });

    test('keeps a uuid that was explicitly provided', () {
      final item = ChecklistItem(uuid: 'fixed-uuid', content: 'Note');

      expect(item.uuid, 'fixed-uuid');
    });

    test('parses and serializes ISO date strings', () {
      final item = ChecklistItem.fromMap(const {
        'uuid': 'item-1',
        'content': 'Note',
        'createdAt': '2024-01-01T09:00:00.000Z',
      });

      expect(item.createdAt, DateTime.parse('2024-01-01T09:00:00.000Z'));
      expect(item.updatedAt, isNull);
      expect(item.toMap()['createdAt'], '2024-01-01T09:00:00.000Z');
    });
  });
}
