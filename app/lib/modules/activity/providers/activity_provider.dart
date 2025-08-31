import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/activity/models/calendar_log.dart';
import 'package:timecalendar/modules/activity/repositories/calendar_log_repository.dart';
import 'package:timecalendar/modules/calendar/providers/user_calendar_provider.dart';

class CalendarLogsNotifier extends AsyncNotifier<List<CalendarLog>> {
  @override
  Future<List<CalendarLog>> build() async {
    // Load from cache initially
    final repository = ref.read(calendarLogRepositoryProvider);
    return repository.getCalendarLogsFromCache();
  }

  /// Refresh calendar logs from API
  Future<void> refresh() async {
    state = const AsyncValue.loading();

    try {
      final userCalendars = await ref.read(userCalendarProvider.future);
      if (userCalendars.isEmpty) {
        state = const AsyncValue.data([]);
        return;
      }

      final tokens = userCalendars.map((calendar) => calendar.token).toList();
      final repository = ref.read(calendarLogRepositoryProvider);
      final calendarLogs = await repository.fetchAndCacheCalendarLogs(tokens);

      state = AsyncValue.data(calendarLogs);
    } catch (error, stackTrace) {
      // If API fails, try to load from cache
      try {
        final repository = ref.read(calendarLogRepositoryProvider);
        final cachedLogs = await repository.getCalendarLogsFromCache();
        state = AsyncValue.data(cachedLogs);
      } catch (cacheError) {
        state = AsyncValue.error(error, stackTrace);
      }
    }
  }

  /// Load calendar logs with fallback to cache
  Future<void> loadCalendarLogs() async {
    try {
      final userCalendars = await ref.read(userCalendarProvider.future);
      if (userCalendars.isEmpty) {
        state = const AsyncValue.data([]);
        return;
      }

      final tokens = userCalendars.map((calendar) => calendar.token).toList();
      final repository = ref.read(calendarLogRepositoryProvider);
      final calendarLogs = await repository.getCalendarLogs(tokens);

      state = AsyncValue.data(calendarLogs);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

final calendarLogsProvider =
    AsyncNotifierProvider<CalendarLogsNotifier, List<CalendarLog>>(
      CalendarLogsNotifier.new,
    );
