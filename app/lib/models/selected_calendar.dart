import 'package:flutter/material.dart';
import 'package:timecalendar/utils/encoded_token.dart';

import 'calendar.dart';
import 'custom_calendar.dart';
import 'unit_calendar.dart';

class SelectedCalendar {
  /// 'custom' or 'unit'
  String type;
  String name;
  bool enabled;
  List<String> calendarIds;

  SelectedCalendar({
    @required this.type,
    @required this.name,
    @required this.enabled,
    @required this.calendarIds,
  });

  factory SelectedCalendar.fromToken(String token) {
    return SelectedCalendar(
      type: 'custom',
      name: 'TimeCalendar',
      enabled: true,
      calendarIds: [token],
    );
  }

  factory SelectedCalendar.fromInternalDb(Map<String, dynamic> dbMap) {
    Map<String, dynamic> map = Map.from(dbMap);
    return SelectedCalendar(
      type: map['type'],
      name: map['name'],
      enabled: map['enabled'],
      calendarIds: List<String>.from(map['calendarIds']).toList(),
    );
  }

  Map<String, dynamic> toMap() {
    Map<String, dynamic> map = {
      'type': type,
      'name': name,
      'enabled': enabled,
      'calendarIds': calendarIds,
    };
    return map;
  }

  Calendar get calendar {
    if (type == 'unit') {
      return UnitCalendar(
        List<int>.from(calendarIds.map((unit) => int.parse(unit))),
      );
    } else {
      return CustomCalendar(calendarIds);
    }
  }
}

/// Find TimeCalendar calendars from an ICal URL
///
/// The user can import his calendars from the web version,
/// If the URL matches the TimeCalendar ICal URL format, we parse it and
/// return a SelectedCalendar
SelectedCalendar findSelectedCalendarFromUrl(String url) {
  RegExp regExp = RegExp(
      r"https:\/\/api\.timecalendar\.app\/calendar\/custom\/([a-zA-Z0-9-_~]+)\.ics");
  var allMatches = regExp.allMatches(url).toList();
  if (allMatches.length == 0) {
    // TimeCalendar URL not found
    return null;
  }
  // Decode the calendar token
  final encodedToken = allMatches[0].group(1);
  final calendars = decodeEncodedToken(encodedToken);

  // Create a selected calendar
  return SelectedCalendar(
    name: 'TimeCalendar',
    type: 'custom',
    calendarIds:
        calendars.entries.where((e) => e.value).map((e) => e.key).toList(),
    enabled: true,
  );
}
