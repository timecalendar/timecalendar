import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/dio/providers/dio_provider.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

class ApiClient {
  Reader _read;
  late TimecalendarApi _api;

  ApiClient(this._read) {
    this._api = TimecalendarApi(dio: this._read(dioProvider));
  }

  SchoolsApi schoolsApi() => this._api.getSchoolsApi();
  CalendarsApi calendarsApi() => this._api.getCalendarsApi();
}

final apiClientProvider = Provider((ref) => ApiClient(ref.read));
