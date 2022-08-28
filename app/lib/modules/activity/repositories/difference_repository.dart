import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/activity/models/difference.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';

class DifferenceRepository {
  static final DifferenceRepository _instance = DifferenceRepository._();

  DifferenceRepository._();
  factory DifferenceRepository() {
    return _instance;
  }

  static const String STORE_NAME = 'differences';
  final _store = stringMapStoreFactory.store(STORE_NAME);

  Database? get _db => SimpleDatabase().db;

  Future<List<Difference>> getDifferences() async {
    final records = await _store.find(_db!,
        finder: Finder(
          sortOrders: [SortOrder('dateDiff', false)],
        ));
    return records
        .map((record) => Difference.fromInternalDb(record.value))
        .toList();
  }

  Future<void> addDifferences(List<Difference> differences) async {
    await _db!.transaction((txn) async {
      // Insert new differences
      for (var i = 0; i < differences.length; i++) {
        await _store
            .record(differences[i].id.toString())
            .put(txn, differences[i].toMap());
      }
    });
  }

  Future<void> deleteAll() async {
    await _store.delete(_db!);
  }
}
