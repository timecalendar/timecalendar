import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/calendar/models/selected_calendar.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';

class SelectedCalendarRepository {
  static final SelectedCalendarRepository _instance =
      SelectedCalendarRepository._();

  SelectedCalendarRepository._();
  factory SelectedCalendarRepository() {
    return _instance;
  }

  static const String STORE_NAME = 'selected_calendars';
  final _store = stringMapStoreFactory.store(STORE_NAME);

  Database? get _db => SimpleDatabase().db;

  Future<void> deleteAllSelectedCalendars() async {
    await _store.delete(_db!);
  }

  Future<List<SelectedCalendar>> getSelectedCalendars() async {
    final records = await _store.find(_db!);
    return records
        .map((record) => SelectedCalendar.fromInternalDb(record.value))
        .toList();
  }

  Future<void> addSelectedCalendar(SelectedCalendar selectedCalendar) async {
    await _store.add(_db!, selectedCalendar.toMap());
  }
}
