import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';
import 'package:timecalendar/modules/calendar/models/deprecated_event.dart';

class PersonalEventManager {
  static final PersonalEventManager _instance = PersonalEventManager._();

  PersonalEventManager._();
  factory PersonalEventManager() {
    return _instance;
  }

  static const String STORE_NAME = 'personal_events';
  final StoreRef<String?, Map<String, Object?>> _store =
      stringMapStoreFactory.store(STORE_NAME);

  Database? get _db => SimpleDatabase().db;

  Future<List<DeprecatedEvent?>> getEvents() async {
    final records = await _store.find(_db!);
    return records
        .map((record) => DeprecatedEvent.fromDb(record.value))
        .toList();
  }

  Future<void> putEvent(DeprecatedEvent event) async {
    await _db!.transaction((txn) async {
      await _store.record(event.uid).put(txn, event.toMap());
    });
  }

  Future<void> removeEvent(String? uid) async {
    await _db!.transaction((txn) async {
      await _store.record(uid).delete(txn);
    });
  }

  Future<void> updateEvent(DeprecatedEvent event) async {
    await _store.record(event.uid).put(_db!, event.toMap());
  }
}
