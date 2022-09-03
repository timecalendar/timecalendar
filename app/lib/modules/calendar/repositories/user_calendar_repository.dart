import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/calendar/models/user_calendar.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';

class UserCalendarRepository {
  Reader read;

  UserCalendarRepository(this.read);

  static const String STORE_NAME = 'user_calendars';
  final _store = stringMapStoreFactory.store(STORE_NAME);

  Database get _db => this.read(databaseProvider);

  Future<List<UserCalendar>> getUserCalendars() async {
    final calendars = await _store.find(_db);
    return calendars
        .map((calendar) => UserCalendar.fromInternalDb(calendar.value))
        .toList();
  }

  setUserCalendar(UserCalendar calendar) async {
    await _store.delete(_db);
    await _store.add(_db, calendar.toDbMap());
  }
}

final userCalendarRepositoryProvider =
    Provider((ref) => UserCalendarRepository(ref.read));