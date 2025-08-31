import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/dio/providers/dio_provider.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

class ApiClient {
  Ref _ref;
  late TimecalendarApi _api;

  ApiClient(this._ref) {
    this._api = TimecalendarApi(dio: this._ref.read(dioProvider));
  }

  SchoolsApi schoolsApi() => this._api.getSchoolsApi();
  CalendarsApi calendarsApi() => this._api.getCalendarsApi();
  ContactApi contactApi() => this._api.getContactApi();
  CalendarLogsApi calendarLogsApi() => this._api.getCalendarLogsApi();
}

final apiClientProvider = Provider((ref) => ApiClient(ref));
