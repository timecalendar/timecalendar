import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/calendar/models/calendar_event.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';

class CalendarEventRepository {
  Ref ref;

  CalendarEventRepository(this.ref);

  static const String STORE_NAME = 'calendar_events';
  final _store = stringMapStoreFactory.store(STORE_NAME);

  Database get _db => this.ref.read(databaseProvider);

  Future<List<CalendarEvent>> getCalendarEvents() async {
    var rawEvents = await _store.find(_db);
    return rawEvents
        .map((event) => CalendarEvent.fromInternalDb(event.value))
        .toList();
  }

  Future<void> putCalendarEvents(List<CalendarEvent> events) async {
    await _dropAll();
    await _store.addAll(_db, events.map((event) => event.toDbMap()).toList());
  }

  Future<void> _dropAll() async {
    await _store.drop(_db);
  }
}

final calendarEventRepositoryProvider = Provider(
  (ref) => CalendarEventRepository(ref),
);
