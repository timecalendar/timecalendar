import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';
import 'package:timecalendar/modules/personal_event/models/personal_event.dart';

class PersonalEventRepository {
  Ref ref;

  PersonalEventRepository(this.ref);

  static const String STORE_NAME = 'personal_events';
  final _store = stringMapStoreFactory.store(STORE_NAME);
  Database get _db => this.ref.read(databaseProvider);

  Future<List<PersonalEvent>> findAll() async {
    final records = await _store.find(_db);
    return records
        .map((record) => PersonalEvent.fromInternalDb(record.value))
        .toList();
  }

  put(PersonalEvent event) async {
    await _store.record(event.uid).put(_db, event.toMap());
  }

  delete(String uid) async {
    await _store.record(uid).delete(_db);
  }
}

final personalEventRepositoryProvider = Provider(
  (ref) => PersonalEventRepository(ref),
);
