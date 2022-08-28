import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/calendar/models/calendar_event.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';

class CalendarEventRepository {
  Reader read;

  CalendarEventRepository(this.read);

  static const String STORE_NAME = 'calendar_events';
  final _store = stringMapStoreFactory.store(STORE_NAME);

  Database get _db => this.read(databaseProvider);

  Future<List<CalendarEvent>> getCalendarEvents() async {
    final events = await _store.find(_db);
    return events
        .map((event) => CalendarEvent.fromInternalDb(event.value))
        .toList();
  }

  setCalendarEvents(List<CalendarEvent> events) async {
    await _store.delete(_db);
    await _store.addAll(_db, events.map((event) => event.toDbMap()).toList());
  }
}

final calendarEventRepositoryProvider =
    Provider((ref) => CalendarEventRepository(ref.read));
