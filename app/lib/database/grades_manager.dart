import 'package:sembast/sembast.dart';
import 'package:timecalendar/database/simple_database.dart';
import 'package:timecalendar/models/grade.dart';

class GradesManager {
  static final GradesManager _instance = GradesManager._();

  GradesManager._();
  factory GradesManager() {
    return _instance;
  }
  static const String STORE_NAME = 'grades';
  final _store = intMapStoreFactory.store(STORE_NAME);

  Database get _db => SimpleDatabase().db;

  Future<List<Grade>> getGradesFromSchool(String schoolCode) async {
    final records = await _store.find(
      _db,
      finder: Finder(
        filter: Filter.equals('schoolCode', schoolCode),
      ),
    );
    return records.map((record) => Grade.fromInternalDb(record.value)).toList();
  }

  Future<void> setGradesFromSchool(
      String schoolCode, List<Grade> grades) async {
    await _db.transaction((txn) async {
      // Delete all grades
      await _store.delete(
        txn,
        finder: Finder(
          filter: Filter.equals('schoolCode', schoolCode),
        ),
      );

      // Insert new grades
      for (var i = 0; i < grades.length; i++) {
        await _store.record(grades[i].id).put(txn, grades[i].toMap());
      }
    });
  }
}
