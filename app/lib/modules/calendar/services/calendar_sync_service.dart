import 'package:built_collection/src/list.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/calendar_event.dart';
import 'package:timecalendar/modules/calendar/repositories/calendar_event_repository.dart';
import 'package:timecalendar/modules/calendar/repositories/user_calendar_repository.dart';
import 'package:timecalendar/modules/shared/clients/timecalendar_client.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

class CalendarSyncService {
  Reader read;

  CalendarSyncService(this.read);

  syncCalendars() async {
    final calendar =
        await this.read(userCalendarRepositoryProvider).getUserCalendar();

    if (calendar == null) return;

    final rep = await this.read(apiClientProvider).calendarsApi().syncCalendars(
            syncCalendarsDto: SyncCalendarsDto(
          (dto) => dto..tokens = ListBuilder([calendar.token]),
        ));

    final List<CalendarEventForPublic> events = rep.data!
        .fold([], (value, element) => [...value, ...element.events.toList()]);
    final calendarEvents =
        events.map((event) => CalendarEvent.fromApi(event)).toList();
    await this
        .read(calendarEventRepositoryProvider)
        .setCalendarEvents(calendarEvents);

    final savedEvents =
        await this.read(calendarEventRepositoryProvider).getCalendarEvents();
    print(savedEvents.length);
  }
}

final calendarSyncServiceProvider =
    Provider((ref) => CalendarSyncService(ref.read));
