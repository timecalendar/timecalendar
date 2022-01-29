import 'package:sembast/sembast.dart';
import 'package:timecalendar/database/simple_database.dart';
import 'package:timecalendar/models/event.dart';

class EventManager {
  static final EventManager _instance = EventManager._();

  EventManager._();
  factory EventManager() {
    return _instance;
  }

  static const String STORE_NAME = 'events';
  final _store = stringMapStoreFactory.store(STORE_NAME);

  Database get _db => SimpleDatabase().db;

  Future<List<Event>> getEvents() async {
    final records = await _store.find(_db);
    return records.map((record) => Event.fromDb(record.value)).toList();
  }

  Future<void> setEvents(List<Event> events) async {
    await _db.transaction((txn) async {
      // Delete all events
      await _store.delete(txn);

      // Insert new events
      for (var i = 0; i < events.length; i++) {
        await _store.record(events[i].uid).put(txn, events[i].toMap());
      }
    });
  }
}
