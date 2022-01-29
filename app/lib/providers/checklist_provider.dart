import 'package:flutter/material.dart';
import 'package:timecalendar/database/checklist_item_manager.dart';
import 'package:timecalendar/models/checklist_item.dart';

class ChecklistProvider with ChangeNotifier {
  List<ChecklistItem> items = [];
  ChecklistItem focusedItem;
  ChecklistItemManager checklistItemManager = ChecklistItemManager();

  Future<void> addItem(String eventUid) async {
    var checklistItem = ChecklistItem(
      eventUid: eventUid,
      content: '',
      isChecked: false,
      order: items.length + 1
    );
    // Add into the list
    items = List<ChecklistItem>.from(items)..add(checklistItem);
    // Insert into database
    await checklistItemManager.insert(checklistItem);

    notifyListeners();
  }

  Future<void> removeItem(String uuid) async {
    // Remove from the list
    items = List<ChecklistItem>.from(items)
      ..removeWhere((item) => item.uuid == uuid);
    // Remove from database
    await checklistItemManager.delete(uuid);
    // Update order
    await updateItemOrders();

    notifyListeners();
  }

  Future<void> editItem(ChecklistItem checklistItem) async {
    var index = items.indexWhere((item) => item.uuid == checklistItem.uuid);
    if (index == -1) return;
    // Update list
    items = List<ChecklistItem>.from(items);
    items[index] = checklistItem;
    // Update database
    await checklistItemManager.update(checklistItem);

    notifyListeners();
  }

  void loadEventItems(String eventUid) async {
    final checklistItemManager = ChecklistItemManager();
    items = await checklistItemManager.findAllByEventUid(eventUid);

    notifyListeners();
  }

  void reorderItems(int oldIndex, int newIndex) {
    var newItems = List<ChecklistItem>.from(items);
    ChecklistItem row = newItems.removeAt(oldIndex);
    newItems.insert(newIndex, row);

    items = newItems;

    // Update order
    updateItemOrders();

    notifyListeners();
  }

  Future<void> updateItemOrders() async {
    for (var i = 0; i < items.length; i++) {
      items[i].order = i + 1;
    }
    await checklistItemManager.updateAll(items);
  }
}
