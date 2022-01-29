import 'package:sembast/sembast.dart';
import 'package:timecalendar/database/simple_database.dart';
import 'package:timecalendar/models/event.dart';

class PersonalEventManager {
  static final PersonalEventManager _instance = PersonalEventManager._();

  PersonalEventManager._();
  factory PersonalEventManager() {
    return _instance;
  }

  static const String STORE_NAME = 'personal_events';
  final _store = stringMapStoreFactory.store(STORE_NAME);

  Database get _db => SimpleDatabase().db;

  Future<List<Event>> getEvents() async {
    final records = await _store.find(_db);
    return records.map((record) => Event.fromDb(record.value)).toList();
  }

  Future<void> putEvent(Event event) async {
    await _db.transaction((txn) async {
      await _store.record(event.uid).put(txn, event.toMap());
    });
  }

  Future<void> removeEvent(String uid) async {
    await _db.transaction((txn) async {
      await _store.record(uid).delete(txn);
    });
  }

  Future<void> updateEvent(Event event) async {
    await _store.record(event.uid).put(_db, event.toMap());
  }
}
