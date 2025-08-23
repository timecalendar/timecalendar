import 'package:sembast/sembast.dart';

Future<void> converUserCalendarsToRecord(Database db) async {
  final store = stringMapStoreFactory.store('user_calendars');
  final data = await store.find(db);

  for (final record in data) {
    if (record.value['id'] != record.key) {
      // insert with the right key
      await store.record(record.value['id'] as String).put(db, record.value);

      // delete the old record
      await store.record(record.key).delete(db);
    }
  }
}
