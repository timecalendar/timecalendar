import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/event_details/repositories/checklist_item_repository.dart';

class EventNbChecklistItemsNotifier
    extends Notifier<Map<String, ChecklistItemEventCount>> {
  @override
  Map<String, ChecklistItemEventCount> build() => {};

  update() async {
    state = await ref
        .read(checklistItemRepositoryProvider)
        .findEventNumberOfNotes();
  }
}

final eventNbChecklistItemsProvider =
    NotifierProvider<
      EventNbChecklistItemsNotifier,
      Map<String, ChecklistItemEventCount>
    >(EventNbChecklistItemsNotifier.new);

final getEventNbChecklistItemsProvider = Provider((ref) {
  final eventNbChecklistItems = ref.watch(eventNbChecklistItemsProvider);

  getEventNbChecklistItems(String eventUid) {
    return eventNbChecklistItems[eventUid] ?? ChecklistItemEventCount();
  }

  return getEventNbChecklistItems;
});
