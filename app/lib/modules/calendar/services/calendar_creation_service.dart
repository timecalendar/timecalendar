import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/user_calendar.dart';
import 'package:timecalendar/modules/calendar/repositories/user_calendar_repository.dart';
import 'package:timecalendar/modules/calendar/services/calendar_sync_service.dart';
import 'package:timecalendar/modules/shared/clients/timecalendar_client.dart';

class CalendarCreationService {
  final Reader read;

  CalendarCreationService(this.read);

  loadCalendarFromToken(String token) async {
    final rep = await this
        .read(apiClientProvider)
        .calendarsApi()
        .findCalendarByToken(token: token);
    final calendarForPublic = rep.data!;
    final userCalendar = UserCalendar.fromCalendarForPublic(calendarForPublic);
    await this
        .read(userCalendarRepositoryProvider)
        .setUserCalendar(userCalendar);

    await this.read(calendarSyncServiceProvider).syncCalendars();
  }
}

final calendarCreationServiceProvider =
    Provider((ref) => CalendarCreationService(ref.read));
