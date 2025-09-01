import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/helpers/events_for_planning_view_helper.dart';
import 'package:timecalendar/modules/calendar/providers/events_provider.dart';

final eventsForPlanningViewProvider = FutureProvider((ref) async {
  final events = await ref.watch(eventsForViewProvider.future);
  return getEventsForPlanningView(events);
});
