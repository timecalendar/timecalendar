import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/calendar/models/user_calendar.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';

class UserCalendarRepository {
  Ref ref;

  UserCalendarRepository(this.ref);

  static const String STORE_NAME = 'user_calendars';
  final _store = stringMapStoreFactory.store(STORE_NAME);

  Database get _db => this.ref.read(databaseProvider);

  Future<List<UserCalendar>> getUserCalendars() async {
    final calendars = await _store.find(_db);
    return calendars
        .map((calendar) => UserCalendar.fromInternalDb(calendar.value))
        .toList();
  }

  Future<void> addUserCalendar(UserCalendar calendar) async {
    await _store.record(calendar.id).put(_db, calendar.toDbMap());
  }

  Future<void> updateUserCalendar(UserCalendar calendar) async {
    await _store.record(calendar.id).update(_db, calendar.toDbMap());
  }

  Future<void> deleteUserCalendar(String id) async {
    await _store.record(id).delete(_db);
  }
}

final userCalendarRepositoryProvider = Provider(
  (ref) => UserCalendarRepository(ref),
);
