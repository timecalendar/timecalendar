import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:timecalendar/constants/environment.dart';

import 'event.dart';

abstract class Calendar {
  Future<List<Event>> fetchEventsFromApi() async {
    print(Environment.mainApiUrl + "calendar");
    final rep = await http.post(
      Uri.parse(Environment.mainApiUrl + "calendar"),
      body: jsonEncode(getRequestMap()),
    );

    var rawEvents = jsonDecode(rep.body) as List<dynamic>;
    List<Event> events =
        rawEvents.map((event) => Event.fromApi(event)).toList();
    return events;
  }

  Map<String, Object> getRequestMap();
  List<Object> getCalendarIds();
  String getMode();
}
