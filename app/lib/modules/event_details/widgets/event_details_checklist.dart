import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:reorderables/reorderables.dart';
import 'package:timecalendar/modules/event_details/controllers/checklist_focus_controller.dart';
import 'package:timecalendar/modules/event_details/models/checklist_item.dart';
import 'package:timecalendar/modules/calendar/models/deprecated_event.dart';
import 'package:timecalendar/modules/event_details/providers/checklist_provider.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';
import 'package:timecalendar/modules/event_details/widgets/event_details_checklist_item.dart';

class EventDetailsChecklist extends StatefulWidget {
  final DeprecatedEvent? event;

  EventDetailsChecklist({Key? key, this.event}) : super(key: key);

  @override
  _EventDetailsChecklistState createState() => _EventDetailsChecklistState();
}

class _EventDetailsChecklistState extends State<EventDetailsChecklist> {
  // Track number of items
  // To set focus to the new added item
  int nbItems = -1;
  late ChecklistProvider checklistProvider;
  late EventsProvider eventsProvider;

  ChecklistFocusController checklistFocusController =
      ChecklistFocusController([]);

  @override
  void initState() {
    super.initState();

    Future.delayed(Duration.zero).then((_) {
      checklistProvider =
          Provider.of<ChecklistProvider>(context, listen: false);
      eventsProvider = Provider.of<EventsProvider>(context, listen: false);

      checklistProvider.addListener(onChecklistChange);
      checklistProvider.loadEventItems(widget.event!.uid);
    });
  }

  @override
  didChangeDependencies() {
    super.didChangeDependencies();
  }

  @override
  void dispose() {
    super.dispose();

    checklistProvider.removeListener(onChecklistChange);
  }

  void onChecklistChange() {
    if (nbItems != -1 &&
        checklistProvider.items.length > 0 &&
        checklistProvider.items.length > nbItems) {
      // Focus the last text input
      Future.delayed(Duration(milliseconds: 100)).then((_) {
        checklistFocusController.focusItem(
            checklistProvider.items[checklistProvider.items.length - 1]);
      });
    }

    nbItems = checklistProvider.items.length;
  }

  Widget buildChecklist(
      BuildContext context, int index, ChecklistProvider checklistProvider) {
    return EventDetailsChecklistItem(
      key: Key(checklistProvider.items[index].uuid!),
      checklistItem: checklistProvider.items[index],
      checklistFocusController: checklistFocusController,
      removeItem: onRemove,
      onContentChanged: onContentChanged,
      onCheckChanged: onCheckChanged,
    );
  }

  Future<void> onRemove(ChecklistItem checklistItem) async {
    await checklistProvider.removeItem(checklistItem.uuid);
    await eventsProvider.updateEventNotes();
  }

  void onContentChanged(ChecklistItem checklistItem, String val) async {
    checklistItem.content = val;

    await checklistProvider.editItem(checklistItem);
  }

  void onCheckChanged(ChecklistItem checklistItem, bool val) async {
    checklistItem.isChecked = val;

    await checklistProvider.editItem(checklistItem);
    await eventsProvider.updateEventNotes();
  }

  @override
  Widget build(BuildContext context) {
    final checklistProvider = Provider.of<ChecklistProvider>(context);

    return ReorderableSliverList(
      delegate: ReorderableSliverChildBuilderDelegate(
        (context, index) => buildChecklist(context, index, checklistProvider),
        childCount: checklistProvider.items.length,
      ),
      onReorder: checklistProvider.reorderItems,
    );
  }
}
