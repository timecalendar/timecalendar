import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';
import 'package:timecalendar/modules/hidden_event/models/hidden_event.dart';

class HiddenEventRepository {
  static final HiddenEventRepository _instance = HiddenEventRepository._();

  HiddenEventRepository._();
  factory HiddenEventRepository() {
    return _instance;
  }

  static const String STORE_NAME = 'hidden_events';
  final _store = stringMapStoreFactory.store(STORE_NAME);

  Database? get _db => SimpleDatabase().db;

  Future<HiddenEvent> getHiddenEvents() async {
    final records = await _store.find(_db!);

    return (records.length > 0)
        ? records.map((record) => HiddenEvent.fromMap(record.value)).toList()[0]
        : new HiddenEvent(namedHiddenEvents: [], uidHiddenEvents: []);
  }

  Future<void> setHiddenEvents(HiddenEvent hiddenEvents) async {
    await _db!.transaction((txn) async {
      await _store.delete(txn);
      await _store.add(txn, hiddenEvents.toMap());
    });
  }
}
