import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:timecalendar/modules/shared/constants/environment.dart';
import 'package:timecalendar/modules/calendar/models/deprecated_event.dart';

abstract class Calendar {
  Future<List<DeprecatedEvent?>> fetchEventsFromApi() async {
    final rep = await http.post(
      Uri.parse(Environment.oldApiUrl + "/calendar"),
      body: jsonEncode(getRequestMap()),
    );

    var rawEvents = jsonDecode(rep.body) as List<dynamic>;
    List<DeprecatedEvent?> events =
        rawEvents.map((event) => DeprecatedEvent.fromApi(event)).toList();
    return events;
  }

  Map<String, Object> getRequestMap();
  List<Object?> getCalendarIds();
  String getMode();
}
