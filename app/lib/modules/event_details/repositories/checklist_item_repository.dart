import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';
import 'package:timecalendar/modules/event_details/models/checklist_item.dart';

class ChecklistItemEventCount {
  int completedNotes = 0;
  int totalNotes = 0;
}

class ChecklistItemRepository {
  Reader read;

  ChecklistItemRepository(this.read);

  static const String STORE_NAME = 'checklist_items';
  final StoreRef<String?, Map<String, Object?>> _store =
      stringMapStoreFactory.store(STORE_NAME);

  Database get _db => this.read(databaseProvider);

  Future insert(ChecklistItem checklistItem) async {
    checklistItem.createdAt = DateTime.now();
    checklistItem.updatedAt = DateTime.now();
    await _store.record(checklistItem.uuid).put(_db, checklistItem.toMap());
  }

  Future update(ChecklistItem checklistItem) async {
    checklistItem.updatedAt = DateTime.now();
    await _store.record(checklistItem.uuid).put(_db, checklistItem.toMap());
  }

  Future updateAll(List<ChecklistItem> checklistItems) async {
    await _db.transaction((txn) async {
      for (var i = 0; i < checklistItems.length; i++) {
        await _store
            .record(checklistItems[i].uuid)
            .put(txn, checklistItems[i].toMap());
      }
    });
  }

  Future delete(String? uuid) async {
    final finder = Finder(filter: Filter.byKey(uuid));
    await _store.delete(
      _db,
      finder: finder,
    );
  }

  Future<List<ChecklistItem>> findAllByEventUid(String? eventUid) async {
    final finder = Finder(
      filter: Filter.equals('eventUid', eventUid),
      sortOrders: [
        SortOrder('order'),
      ],
    );

    final records = await _store.find(
      _db,
      finder: finder,
    );

    return records.map((record) {
      final checklistItem = ChecklistItem.fromMap(record.value);
      checklistItem.uuid = record.key;
      return checklistItem;
    }).toList();
  }

  Future<Map<String, ChecklistItemEventCount>> findEventNumberOfNotes() async {
    final records = await _store.find(_db);
    final numberOfNotes = Map<String, ChecklistItemEventCount>();

    records.forEach((record) {
      final checklistItem = ChecklistItem.fromMap(record.value);

      if (checklistItem.eventUid != null &&
          !numberOfNotes.containsKey(checklistItem.eventUid)) {
        numberOfNotes[checklistItem.eventUid!] = ChecklistItemEventCount();
      }

      if (checklistItem.isChecked!)
        numberOfNotes[checklistItem.eventUid]!.completedNotes++;
      numberOfNotes[checklistItem.eventUid]!.totalNotes++;
    });

    return numberOfNotes;
  }
}

final checklistItemRepositoryProvider =
    Provider((ref) => ChecklistItemRepository(ref.read));
