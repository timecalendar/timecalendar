import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:sembast/sembast.dart';
import 'package:timecalendar/modules/activity/models/calendar_log.dart';
import 'package:timecalendar/modules/activity/models/calendar_change.dart';
import 'package:timecalendar/modules/activity/models/calendar_log_event.dart';
import 'package:timecalendar/modules/database/providers/simple_database.dart';
import 'package:timecalendar/modules/shared/clients/timecalendar_client.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

class CalendarLogRepository {
  final Ref ref;
  final StoreRef<String, Map<String, Object?>> _store =
      StoreRef<String, Map<String, Object?>>('calendar_logs');

  CalendarLogRepository(this.ref);

  /// Get calendar logs from cache
  Future<List<CalendarLog>> getCalendarLogsFromCache() async {
    final db = ref.read(databaseProvider);
    final records = await _store.find(db);
    return records
        .map((record) => CalendarLog.fromInternalDb(record.value))
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  /// Fetch calendar logs from API and cache them
  Future<List<CalendarLog>> fetchAndCacheCalendarLogs(
    List<String> tokens,
  ) async {
    print('fetchAndCacheCalendarLogs: $tokens');
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.calendarLogsApi().getCalendarLogs(
        getCalendarLogsDto: GetCalendarLogsDto(
          (dto) => dto..tokens.replace(tokens),
        ),
      );

      print('response: ${response.data}');

      final calendarLogs =
          response.data!.map((dto) => _mapFromApiDto(dto)).toList()
            ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

      // Cache the results
      await _cacheCalendarLogs(calendarLogs);

      return calendarLogs;
    } catch (error) {
      print('error: $error');
      // If API call fails, return cached data
      return getCalendarLogsFromCache();
    }
  }

  /// Get calendar logs with fallback strategy: try API first, then cache
  Future<List<CalendarLog>> getCalendarLogs(List<String> tokens) async {
    try {
      // Try to fetch from API and cache
      return await fetchAndCacheCalendarLogs(tokens);
    } catch (error) {
      // If everything fails, return cached data
      return getCalendarLogsFromCache();
    }
  }

  /// Cache calendar logs locally
  Future<void> _cacheCalendarLogs(List<CalendarLog> calendarLogs) async {
    final db = ref.read(databaseProvider);
    await db.transaction((txn) async {
      // Clear existing logs
      await _store.delete(txn);
      // Add new logs
      for (final log in calendarLogs) {
        await _store.record(log.id).put(txn, log.toDbMap());
      }
    });
  }

  /// Map from API DTO to internal model
  CalendarLog _mapFromApiDto(CalendarLogGet dto) {
    return CalendarLog(
      id: dto.id,
      calendarId: dto.calendarId,
      calendarToken: dto.calendarToken,
      calendarName: dto.calendarName,
      calendarChange: _mapCalendarChangeFromDto(dto.calendarChange),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    );
  }

  /// Map calendar change from API DTO
  CalendarChange _mapCalendarChangeFromDto(CalendarChangeGet dto) {
    return CalendarChange(
      oldItems: dto.oldItems
          .map((event) => _mapCalendarLogEventFromDto(event))
          .toList(),
      newItems: dto.newItems
          .map((event) => _mapCalendarLogEventFromDto(event))
          .toList(),
      changedItems: dto.changedItems
          .map(
            (changedItem) => CalendarEventChange(
              oldEvent: _mapCalendarLogEventFromDto(changedItem.previousItem),
              newEvent: _mapCalendarLogEventFromDto(changedItem.newItem),
            ),
          )
          .toList(),
    );
  }

  /// Map calendar log event from API DTO
  CalendarLogEvent _mapCalendarLogEventFromDto(CalendarLogEventGet dto) {
    return CalendarLogEvent(
      uid: dto.uid,
      title: dto.title,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      location: dto.location,
    );
  }
}

final calendarLogRepositoryProvider = Provider(
  (ref) => CalendarLogRepository(ref),
);
