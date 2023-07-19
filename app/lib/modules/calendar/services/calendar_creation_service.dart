import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/models/user_calendar.dart';
import 'package:timecalendar/modules/calendar/repositories/user_calendar_repository.dart';
import 'package:timecalendar/modules/calendar/services/calendar_sync_service.dart';
import 'package:timecalendar/modules/shared/clients/timecalendar_client.dart';

class CalendarCreationService {
  final Ref ref;

  CalendarCreationService(this.ref);

  loadCalendarFromToken(String token) async {
    final rep = await this
        .ref
        .read(apiClientProvider)
        .calendarsApi()
        .findCalendarByToken(token: token);
    final calendarForPublic = rep.data!;
    final userCalendar = UserCalendar.fromCalendarForPublic(calendarForPublic);
    await this
        .ref
        .read(userCalendarRepositoryProvider)
        .setUserCalendar(userCalendar);

    await this.ref.read(calendarSyncServiceProvider).syncCalendars();
  }
}

final calendarCreationServiceProvider =
    Provider((ref) => CalendarCreationService(ref));
