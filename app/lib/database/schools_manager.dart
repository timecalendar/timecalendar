import 'package:sembast/sembast.dart';
import 'package:timecalendar/database/simple_database.dart';
import 'package:timecalendar/modules/school/models/school.dart';

class SchoolsManager {
  static final SchoolsManager _instance = SchoolsManager._();

  SchoolsManager._();
  factory SchoolsManager() {
    return _instance;
  }

  static const String STORE_NAME = 'schools';
  final StoreRef<String?, Map<String, Object?>> _store = stringMapStoreFactory.store(STORE_NAME);

  Database? get _db => SimpleDatabase().db;

  Future<List<School>> getSchools() async {
    final records = await _store.find(_db!);
    return records
        .map((record) => School.fromInternalDb(record.value))
        .toList();
  }

  Future<void> setSchools(List<School> schools) async {
    await _db!.transaction((txn) async {
      // Delete all schools
      await _store.delete(txn);

      // Insert new schools
      for (var i = 0; i < schools.length; i++) {
        await _store.record(schools[i].code).put(txn, schools[i].toMap());
      }
    });
  }
}
