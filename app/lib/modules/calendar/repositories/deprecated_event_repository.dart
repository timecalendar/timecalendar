import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';
import 'package:timecalendar/modules/calendar/models/deprecated_event.dart';

class DeprecatedEventRepository {
  static final DeprecatedEventRepository _instance =
      DeprecatedEventRepository._();

  DeprecatedEventRepository._();
  factory DeprecatedEventRepository() {
    return _instance;
  }

  static const String STORE_NAME = 'events';
  final StoreRef<String?, Map<String, Object?>> _store =
      stringMapStoreFactory.store(STORE_NAME);

  Database? get _db => SimpleDatabase().db;

  Future<List<DeprecatedEvent?>> getEvents() async {
    final records = await _store.find(_db!);
    return records
        .map((record) => DeprecatedEvent.fromDb(record.value))
        .toList();
  }

  Future<void> setEvents(List<DeprecatedEvent?> events) async {
    await _db!.transaction((txn) async {
      // Delete all events
      await _store.delete(txn);

      // Insert new events
      for (var i = 0; i < events.length; i++) {
        await _store.record(events[i]!.uid).put(txn, events[i]!.toMap());
      }
    });
  }
}
