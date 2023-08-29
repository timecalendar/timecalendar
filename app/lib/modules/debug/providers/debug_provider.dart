import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/services/calendar_sync_service.dart';

final debugCalendarDetailsProvider =
    FutureProvider.autoDispose<String>((ref) async {
  final calendarSyncService = ref.read(calendarSyncServiceProvider);

  final calendars = await calendarSyncService.loadUserCalendarsFromDatabase();

  return calendars.toString();
});
