import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/event_details/repositories/checklist_item_repository.dart';

class EventNbChecklistItemsNotifier
    extends StateNotifier<Map<String, ChecklistItemEventCount>> {
  Reader read;

  EventNbChecklistItemsNotifier(this.read) : super({});

  update() async {
    state =
        await read(checklistItemRepositoryProvider).findEventNumberOfNotes();
  }
}

final eventNbChecklistItemsProvider = StateNotifierProvider<
        EventNbChecklistItemsNotifier, Map<String, ChecklistItemEventCount>>(
    (ref) => EventNbChecklistItemsNotifier(ref.read));

final getEventNbChecklistItemsProvider = Provider((ref) {
  final eventNbChecklistItems = ref.watch(eventNbChecklistItemsProvider);

  getEventNbChecklistItems(String eventUid) {
    return eventNbChecklistItems[eventUid] ?? ChecklistItemEventCount();
  }

  return getEventNbChecklistItems;
});
