import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/user_calendar.dart';
import 'package:timecalendar/modules/calendar/repositories/user_calendar_repository.dart';

class UserCalendarsNotifier extends AsyncNotifier<List<UserCalendar>> {
  @override
  Future<List<UserCalendar>> build() async {
    final repo = ref.read(userCalendarRepositoryProvider);
    return repo.getUserCalendars();
  }

  Future<void> toggleVisibility(UserCalendar calendar) async {
    final repo = ref.read(userCalendarRepositoryProvider);
    final updated = UserCalendar(
      id: calendar.id,
      name: calendar.name,
      token: calendar.token,
      schoolName: calendar.schoolName,
      schoolId: calendar.schoolId,
      lastUpdatedAt: calendar.lastUpdatedAt,
      createdAt: calendar.createdAt,
      visible: !calendar.visible,
    );
    await repo.updateUserCalendar(updated);

    // Refresh state
    state = await AsyncValue.guard(() async {
      final calendars = await repo.getUserCalendars();
      return calendars;
    });
  }

  Future<void> addUserCalendar(UserCalendar calendar) async {
    final repo = ref.read(userCalendarRepositoryProvider);
    await repo.addUserCalendar(calendar);
    // Refresh state
    state = await AsyncValue.guard(() async {
      final calendars = await repo.getUserCalendars();
      return calendars;
    });
  }

  Future<void> deleteCalendar(String id) async {
    final repo = ref.read(userCalendarRepositoryProvider);
    await repo.deleteUserCalendar(id);
    // Refresh state
    state = await AsyncValue.guard(() async {
      final calendars = await repo.getUserCalendars();
      return calendars;
    });
  }
}

final userCalendarProvider =
    AsyncNotifierProvider<UserCalendarsNotifier, List<UserCalendar>>(
      UserCalendarsNotifier.new,
    );
