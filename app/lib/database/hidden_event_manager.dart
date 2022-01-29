import 'package:sembast/sembast.dart';
import 'package:timecalendar/database/simple_database.dart';
import 'package:timecalendar/models/hidden_event.dart';

class HiddenEventManager {
  static final HiddenEventManager _instance = HiddenEventManager._();

  HiddenEventManager._();
  factory HiddenEventManager() {
    return _instance;
  }

  static const String STORE_NAME = 'hidden_events';
  final _store = stringMapStoreFactory.store(STORE_NAME);

  Database get _db => SimpleDatabase().db;

  Future<HiddenEvent> getHiddenEvents() async {
    final records = await _store.find(_db);

    return (records.length > 0)
        ? records.map((record) => HiddenEvent.fromMap(record.value)).toList()[0]
        : new HiddenEvent(namedHiddenEvents: [], uidHiddenEvents: []);
  }

  Future<void> setHiddenEvents(HiddenEvent hiddenEvents) async {
    await _db.transaction((txn) async {
      // Delete hidden events
      await _store.delete(txn);

      // Insert new hidden events
      await _store.add(txn, hiddenEvents.toMap());
    });
  }
}
