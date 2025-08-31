import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:collection/collection.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';
import 'package:timecalendar/modules/shared/utils/date_utils.dart';

final dayDisplayedOnHomePageProvider = FutureProvider<DateTime?>((ref) async {
  final events = await ref.watch(eventsForViewProvider.future);
  final now = DateTime.now();
  DateTime today = DateTime(now.year, now.month, now.day, 0, 0, 0);

  if (events.length == 0) return null;

  final firstEvent = events.firstWhereOrNull((event) {
    return event.startsAt.isAfter(today);
  });

  if (firstEvent == null) return today;

  return DateTime(
    firstEvent.startsAt.year,
    firstEvent.startsAt.month,
    firstEvent.startsAt.day,
    0,
    0,
    0,
  );
});

final homeEventsProvider = FutureProvider<List<EventInterface>>((ref) async {
  final events = await ref.watch(eventsForViewProvider.future);
  final dayDisplayedOnHomePage = await ref.watch(
    dayDisplayedOnHomePageProvider.future,
  );

  if (events.length == 0 || dayDisplayedOnHomePage == null) return [];

  var dayEvents = events
      .where(
        (event) => AppDateUtils.sameDay(dayDisplayedOnHomePage, event.startsAt),
      )
      .toList();

  return dayEvents;
});
