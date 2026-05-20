import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/event_details/models/checklist_item.dart';
import 'package:timecalendar/modules/event_details/providers/event_nb_checklist_items_provider.dart';
import 'package:timecalendar/modules/event_details/repositories/checklist_item_repository.dart';

class ChecklistItemNotifier extends Notifier<List<ChecklistItem>> {
  ChecklistItemNotifier(this.eventUid);

  final String eventUid;

  @override
  List<ChecklistItem> build() {
    _loadEventItems();
    return [];
  }

  Future<void> _loadEventItems() async {
    state = await ref
        .read(checklistItemRepositoryProvider)
        .findAllByEventUid(eventUid);
  }

  Future<void> addItem() async {
    var checklistItem = ChecklistItem(
      eventUid: eventUid,
      content: '',
      isChecked: false,
      order: state.length + 1,
    );
    state = List<ChecklistItem>.from(state)..add(checklistItem);
    await ref.read(checklistItemRepositoryProvider).insert(checklistItem);
    await ref.read(eventNbChecklistItemsProvider.notifier).update();
  }

  Future<void> editItem(ChecklistItem checklistItem) async {
    var index = state.indexWhere((item) => item.uuid == checklistItem.uuid);
    if (index == -1) return;
    final editedState = List<ChecklistItem>.from(state);
    editedState[index] = checklistItem;
    state = editedState;
    await ref.read(checklistItemRepositoryProvider).update(checklistItem);
    await ref.read(eventNbChecklistItemsProvider.notifier).update();
  }

  Future<void> removeItem(String? uuid) async {
    if (uuid == null) return;
    state = List<ChecklistItem>.from(state)
      ..removeWhere((item) => item.uuid == uuid);
    await ref.read(checklistItemRepositoryProvider).delete(uuid);
    await updateItemOrders();
    await ref.read(eventNbChecklistItemsProvider.notifier).update();
  }

  void reorderItems(int oldIndex, int newIndex) {
    var newItems = List<ChecklistItem>.from(state);
    ChecklistItem row = newItems.removeAt(oldIndex);
    newItems.insert(newIndex, row);
    state = newItems;
    updateItemOrders();
  }

  Future<void> updateItemOrders() async {
    final orderedItems = List<ChecklistItem>.from(state);
    for (var i = 0; i < orderedItems.length; i++) {
      orderedItems[i].order = i + 1;
    }
    state = orderedItems;
    await ref.read(checklistItemRepositoryProvider).updateAll(state);
  }
}

final checklistItemProvider =
    NotifierProvider.family<
      ChecklistItemNotifier,
      List<ChecklistItem>,
      String
    >(ChecklistItemNotifier.new);
