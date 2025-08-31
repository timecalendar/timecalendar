import 'package:built_collection/src/list.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/calendar_event.dart';
import 'package:timecalendar/modules/calendar/models/user_calendar.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';
import 'package:timecalendar/modules/calendar/providers/user_calendar_provider.dart';
import 'package:timecalendar/modules/calendar/repositories/calendar_event_repository.dart';
import 'package:timecalendar/modules/shared/clients/timecalendar_client.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

/// Service responsible for synchronizing and loading user calendars and events.
class CalendarSyncService {
  final Ref ref;

  CalendarSyncService(this.ref);

  /// Loads calendar events from the local database, sorts them, and updates the provider.
  Future<List<CalendarEvent>> loadEventsFromDatabase() async {
    final eventRepo = ref.read(calendarEventRepositoryProvider);
    final events = await eventRepo.getCalendarEvents();
    events.sort((a, b) => a.startsAt.compareTo(b.startsAt));
    ref.read(calendarEventsProvider.notifier).state = events;
    return events;
  }

  /// Synchronizes calendars with the remote API and loads updated events into the database and provider.
  Future<void> syncAndLoadCalendars() async {
    final userCalendars = await ref.read(userCalendarProvider.future);
    if (userCalendars.isEmpty) return;
    final calendarsWithContent = await _fetchCalendars(userCalendars);
    await _putEventsToDatabase(calendarsWithContent);
    await loadEventsFromDatabase();
  }

  /// Fetches calendars with their content from the remote API.
  Future<List<CalendarWithContent>> _fetchCalendars(
    List<UserCalendar> userCalendars,
  ) async {
    if (userCalendars.isEmpty) return [];
    final apiClient = ref.read(apiClientProvider);
    final response = await apiClient.calendarsApi().syncCalendars(
      syncCalendarsDto: SyncCalendarsDto(
        (dto) => dto
          ..tokens = ListBuilder(
            userCalendars.map((calendar) => calendar.token),
          ),
      ),
    );
    return response.data!.toList();
  }

  Future<void> _putEventsToDatabase(
    List<CalendarWithContent> calendarsWithContent,
  ) async {
    final events = calendarsWithContent
        .map(
          (calendar) => calendar.events.map(
            (event) => CalendarEvent.fromApi(
              event,
              userCalendarId: calendar.calendar.id,
            ),
          ),
        )
        .expand((calendar) => calendar)
        .toList();
    await ref.read(calendarEventRepositoryProvider).putCalendarEvents(events);
  }
}

/// Provider for CalendarSyncService.
final calendarSyncServiceProvider = Provider((ref) => CalendarSyncService(ref));
