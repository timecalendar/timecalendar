import 'package:sembast/sembast.dart';
import 'package:timecalendar/database/differences_manager.dart';
import 'package:timecalendar/database/simple_database.dart';
import 'package:timecalendar/models/selected_calendar.dart';
import 'package:timecalendar/models/unit.dart';

import 'calendar_manager.dart';

class UnitsManager {
  static final UnitsManager _instance = UnitsManager._();

  UnitsManager._();
  factory UnitsManager() {
    return _instance;
  }
  static const String STORE_NAME = 'units';
  final _store = intMapStoreFactory.store(STORE_NAME);

  Database get _db => SimpleDatabase().db;

  Future<List<Unit>> getUnitsFromGrades(int gradeId) async {
    final records = await _store.find(
      _db,
      finder: Finder(
        filter: Filter.equals('gradeId', gradeId),
      ),
    );
    return records.map((record) => Unit.fromInternalDb(record.value)).toList();
  }

  Future<void> setUnitsFromGrades(int gradeId, List<Unit> units) async {
    await _db.transaction((txn) async {
      // Delete all grades
      await _store.delete(
        txn,
        finder: Finder(
          filter: Filter.equals('gradeId', gradeId),
        ),
      );

      // Insert new grades
      for (var i = 0; i < units.length; i++) {
        await _store.record(units[i].id).put(txn, units[i].toMap());
      }
    });
  }

  Future<void> saveSelectedUnits(List<Unit> units) async {
    // Insert selected units
    List<String> unitsText = units.map((unit) => unit.id.toString());
    final calendar = SelectedCalendar(
      type: 'unit',
      name: 'TimeCalendar',
      enabled: true,
      calendarIds: unitsText,
    );
    final differencesManager = DifferencesManager();
    await differencesManager.deleteAll();
    await CalendarManager.setCalendar(calendar);
  }
}
