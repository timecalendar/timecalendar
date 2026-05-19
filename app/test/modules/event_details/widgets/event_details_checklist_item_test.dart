import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:timecalendar/modules/event_details/controllers/checklist_focus_controller.dart';
import 'package:timecalendar/modules/event_details/models/checklist_item.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_checklist_item.dart';

import '../../../support/pump_app.dart';

void main() {
  // The widget reads `checklistItem.content!`, so the fixture must be non-null.
  ChecklistItem buildItem({bool isChecked = false}) => ChecklistItem(
    uuid: 'item-1',
    content: 'Réviser le chapitre 3',
    isChecked: isChecked,
  );

  Widget buildWidget(
    ChecklistItem item, {
    void Function(ChecklistItem, dynamic)? onCheckChanged,
    void Function(ChecklistItem)? removeItem,
  }) {
    return EventDetailsChecklistItem(
      checklistItem: item,
      checklistFocusController: ChecklistFocusController([]),
      removeItem: removeItem ?? (_) {},
      onContentChanged: (_, __) {},
      onCheckChanged: onCheckChanged ?? (_, __) {},
    );
  }

  group('EventDetailsChecklistItem', () {
    testWidgets('renders the item content in the text field', (tester) async {
      await tester.pumpApp(buildWidget(buildItem()));
      await tester.pump(Duration.zero);

      expect(find.text('Réviser le chapitre 3'), findsOneWidget);
    });

    testWidgets('reflects the checked state on the checkbox', (tester) async {
      await tester.pumpApp(buildWidget(buildItem(isChecked: true)));
      await tester.pump(Duration.zero);

      final checkbox = tester.widget<Checkbox>(find.byType(Checkbox));
      expect(checkbox.value, isTrue);
    });

    testWidgets('calls onCheckChanged when the checkbox is tapped', (
      tester,
    ) async {
      final item = buildItem(isChecked: true);
      ChecklistItem? changedItem;
      dynamic changedValue;

      await tester.pumpApp(
        buildWidget(
          item,
          onCheckChanged: (i, v) {
            changedItem = i;
            changedValue = v;
          },
        ),
      );
      await tester.pump(Duration.zero);

      await tester.tap(find.byType(Checkbox));
      await tester.pump(Duration.zero);

      expect(changedItem, same(item));
      expect(changedValue, isFalse);
    });

    testWidgets('calls removeItem when the close icon is tapped', (
      tester,
    ) async {
      final item = buildItem();
      ChecklistItem? removed;

      await tester.pumpApp(buildWidget(item, removeItem: (i) => removed = i));
      await tester.pump(Duration.zero);

      await tester.tap(find.byIcon(Icons.close));
      await tester.pump(Duration.zero);

      expect(removed, same(item));
    });
  });
}
