import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:reorderables/reorderables.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/event_details/controllers/checklist_focus_controller.dart';
import 'package:timecalendar/modules/event_details/hooks/use_checklist_auto_focus.dart';
import 'package:timecalendar/modules/event_details/models/checklist_item.dart';
import 'package:timecalendar/modules/event_details/providers/checklist_item_provider.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_checklist_item.dart';

class EventDetailsChecklist extends HookConsumerWidget {
  final EventInterface event;

  EventDetailsChecklist({Key? key, required this.event}) : super(key: key);

  final ChecklistFocusController checklistFocusController =
      ChecklistFocusController([]);

  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(checklistItemProvider(event.uid));
    final notifier = ref.watch(checklistItemProvider(event.uid).notifier);

    useChecklistAutoFocus(checklistFocusController, items);

    Future<void> onRemove(ChecklistItem checklistItem) async {
      await notifier.removeItem(checklistItem.uuid);
    }

    void onContentChanged(ChecklistItem checklistItem, String val) async {
      checklistItem.content = val;
      await notifier.editItem(checklistItem);
    }

    void onCheckChanged(ChecklistItem checklistItem, bool val) async {
      checklistItem.isChecked = val;
      await notifier.editItem(checklistItem);
    }

    Widget buildChecklist(
        BuildContext context, int index, List<ChecklistItem> items) {
      return EventDetailsChecklistItem(
        key: Key(items[index].uuid!),
        checklistItem: items[index],
        checklistFocusController: checklistFocusController,
        removeItem: onRemove,
        onContentChanged: onContentChanged,
        onCheckChanged: onCheckChanged,
      );
    }

    return ReorderableSliverList(
      delegate: ReorderableSliverChildBuilderDelegate(
        (context, index) => buildChecklist(context, index, items),
        childCount: items.length,
      ),
      onReorder: notifier.reorderItems,
    );
  }
}
