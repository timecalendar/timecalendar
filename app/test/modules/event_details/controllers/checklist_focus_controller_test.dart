import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/event_details/controllers/checklist_focus_controller.dart';
import 'package:timecalendar/modules/event_details/models/checklist_item.dart';

void main() {
  group('ChecklistFocusController', () {
    test('invokes listeners passed to the constructor on focusItem', () {
      final focused = <ChecklistItem>[];
      final controller = ChecklistFocusController([focused.add]);
      final item = ChecklistItem(content: 'Note');

      controller.focusItem(item);

      expect(focused, [item]);
    });

    test('addListener registers a new listener', () {
      final focused = <ChecklistItem>[];
      final controller = ChecklistFocusController([]);
      final item = ChecklistItem(content: 'Note');

      controller.addListener(focused.add);
      controller.focusItem(item);

      expect(focused, [item]);
    });

    test('removeListener stops a listener from being notified', () {
      final focused = <ChecklistItem>[];
      void listener(ChecklistItem item) => focused.add(item);
      final controller = ChecklistFocusController([listener]);

      controller.removeListener(listener);
      controller.focusItem(ChecklistItem(content: 'Note'));

      expect(focused, isEmpty);
    });
  });
}
