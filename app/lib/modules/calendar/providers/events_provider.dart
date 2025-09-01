import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/calendar_event.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/calendar/providers/user_calendar_provider.dart';
import 'package:timecalendar/modules/hidden_event/providers/hidden_event_provider.dart';
import 'package:timecalendar/modules/personal_event/providers/personal_events_provider.dart';

final calendarEventsProvider = StateProvider<List<CalendarEvent>>((ref) => []);

class EventsNotifier extends AsyncNotifier<List<EventInterface>> {
  @override
  Future<List<EventInterface>> build() async {
    final calendarEvents = ref.watch(calendarEventsProvider);
    final personalEventsAsync = await ref.watch(personalEventsProvider.future);

    final events = <EventInterface>[...calendarEvents, ...personalEventsAsync];
    events.sort((a, b) => a.startsAt.compareTo(b.startsAt));
    return events;
  }
}

/// Provides the list of events, combining calendar and personal events
final eventsProvider =
    AsyncNotifierProvider<EventsNotifier, List<EventInterface>>(
      EventsNotifier.new,
    );

class EventsForViewNotifier extends AsyncNotifier<List<EventInterface>> {
  @override
  Future<List<EventInterface>> build() async {
    final events = await ref.watch(eventsProvider.future);
    final hiddenEvents = ref.watch(hiddenEventProvider);
    final userCalendars = await ref.watch(userCalendarProvider.future);

    final visibleUserCalendarIds = userCalendars
        .where((calendar) => calendar.visible)
        .map((calendar) => calendar.id)
        .toSet();

    return events
        .where(
          (event) =>
              !hiddenEvents.uidHiddenEvents.contains(event.uid) &&
              !hiddenEvents.namedHiddenEvents.contains(event.title) &&
              (event.userCalendarId == null ||
                  visibleUserCalendarIds.contains(event.userCalendarId)),
        )
        .toList();
  }
}

final eventsForViewProvider =
    AsyncNotifierProvider<EventsForViewNotifier, List<EventInterface>>(
      EventsForViewNotifier.new,
    );
