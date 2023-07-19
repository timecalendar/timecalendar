import 'package:built_collection/src/list.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/calendar_event.dart';
import 'package:timecalendar/modules/calendar/models/user_calendar.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';
import 'package:timecalendar/modules/calendar/providers/user_calendar_provider.dart';
import 'package:timecalendar/modules/calendar/repositories/calendar_event_repository.dart';
import 'package:timecalendar/modules/calendar/repositories/user_calendar_repository.dart';
import 'package:timecalendar/modules/shared/clients/timecalendar_client.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

class CalendarSyncService {
  Ref ref;

  CalendarSyncService(this.ref);

  Future<List<UserCalendar>> loadUserCalendarsFromDatabase() async {
    final calendars =
        await this.ref.read(userCalendarRepositoryProvider).getUserCalendars();
    this.ref.read(userCalendarsProvider.notifier).state = calendars;
    return calendars;
  }

  Future<List<CalendarEvent>> loadEventsFromDatabase() async {
    final events = await this
        .ref
        .read(calendarEventRepositoryProvider)
        .getCalendarEvents();
    events.sort((a, b) => a.startsAt.compareTo(b.startsAt));
    this.ref.read(calendarEventsProvider.notifier).state = events;
    return events;
  }

  Future<List<CalendarEventForPublic>> fetchCalendars(
      List<UserCalendar> calendars) async {
    if (calendars.length == 0) return [];

    final rep =
        await this.ref.read(apiClientProvider).calendarsApi().syncCalendars(
                syncCalendarsDto: SyncCalendarsDto(
              (dto) => dto
                ..tokens =
                    ListBuilder(calendars.map((calendar) => calendar.token)),
            ));
    final List<CalendarEventForPublic> events = rep.data!
        .fold([], (value, element) => [...value, ...element.events.toList()]);
    return events;
  }

  syncCalendars() async {
    final calendars = await loadUserCalendarsFromDatabase();
    final events = await fetchCalendars(calendars);
    final calendarEvents =
        events.map((event) => CalendarEvent.fromApi(event)).toList();
    await this
        .ref
        .read(calendarEventRepositoryProvider)
        .setCalendarEvents(calendarEvents);
    await this.loadEventsFromDatabase();
  }
}

final calendarSyncServiceProvider = Provider((ref) => CalendarSyncService(ref));
