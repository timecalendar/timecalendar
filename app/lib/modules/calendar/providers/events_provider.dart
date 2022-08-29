import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/calendar_event.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/hidden_event/providers/hidden_event_provider.dart';
import 'package:timecalendar/modules/personal_event/providers/personal_events_provider.dart';

final calendarEventsProvider = StateProvider<List<CalendarEvent>>((ref) => []);

/// Provides the list of events, including hidden ones
final eventsProvider = Provider<List<EventInterface>>((ref) {
  final events = [
    ...ref.watch(calendarEventsProvider),
    ...ref.watch(personalEventsProvider),
  ];
  events.sort((a, b) => a.startsAt.compareTo(b.startsAt));
  return events;
});

/// Provides the list of events to display to the user on calendar views
final eventsForViewProvider = Provider<List<EventInterface>>((ref) {
  final events = ref.watch(eventsProvider);
  final hiddenEvents = ref.watch(hiddenEventProvider);

  return events
      .where((event) =>
          !hiddenEvents.uidHiddenEvents.contains(event.uid) &&
          !hiddenEvents.namedHiddenEvents.contains(event.title))
      .toList();
});
