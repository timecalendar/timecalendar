import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/calendar_event_custom_fields.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/calendar/models/event_tag.dart';
import 'package:timecalendar/modules/shared/utils/color_utils.dart';
import 'package:timecalendar_api/timecalendar_api.dart' as Api;

class CalendarEvent implements EventInterface {
  String uid;
  String title;
  Color color;
  Color groupColor;
  DateTime startsAt;
  DateTime endsAt;
  String? location;
  bool allDay;
  String? description;
  List<String> teachers;
  List<EventTag> tags;
  CalendarEventCustomFields? fields;
  DateTime exportedAt;
  String userCalendarId;
  EventKind get kind => EventKind.Calendar;

  CalendarEvent({
    required this.uid,
    required this.title,
    required this.color,
    required this.groupColor,
    required this.startsAt,
    required this.endsAt,
    required this.location,
    required this.allDay,
    required this.description,
    required this.teachers,
    required this.tags,
    required this.fields,
    required this.exportedAt,
    required this.userCalendarId,
  });

  factory CalendarEvent.fromApi(
    Api.CalendarEventForPublic calendar, {
    String? userCalendarId,
  }) {
    return CalendarEvent(
      uid: calendar.uid,
      title: calendar.title,
      color: ColorUtils.hexToColor(calendar.color),
      groupColor: ColorUtils.hexToColor(calendar.groupColor),
      startsAt: calendar.startsAt,
      endsAt: calendar.endsAt,
      location: calendar.location,
      allDay: calendar.allDay,
      description: calendar.description,
      teachers: calendar.teachers.toList(),
      tags: calendar.tags.map((tag) => EventTag.fromApi(tag)).toList(),
      fields: calendar.fields != null
          ? CalendarEventCustomFields.fromApi(calendar.fields!)
          : null,
      exportedAt: calendar.exportedAt,
      userCalendarId: userCalendarId ?? '',
    );
  }

  factory CalendarEvent.fromInternalDb(Map<String, dynamic> map) {
    return CalendarEvent(
      uid: map['uid'],
      title: map['title'],
      color: ColorUtils.hexToColor(map['color']),
      groupColor: ColorUtils.hexToColor(map['groupColor']),
      startsAt: DateTime.parse(map['startsAt']).toLocal(),
      endsAt: DateTime.parse(map['endsAt']).toLocal(),
      location: map['location'],
      allDay: map['allDay'],
      description: map['description'],
      teachers: List<String>.from(map['teachers']),
      tags: List<Map<String, dynamic>>.from(
        map['tags'],
      ).map((tag) => EventTag.fromDb(tag)).toList(),
      fields: map['fields'] != null
          ? CalendarEventCustomFields.fromInternalDb(map['fields'])
          : null,
      exportedAt: DateTime.parse(map['exportedAt']).toLocal(),
      userCalendarId:
          map['userCalendarId'] ?? '', // null safety for backward compatibility
    );
  }

  Map<String, dynamic> toDbMap() {
    return {
      'uid': uid,
      'title': title,
      'color': ColorUtils.colorToHex(color),
      'groupColor': ColorUtils.colorToHex(groupColor),
      'startsAt': startsAt.toUtc().toIso8601String(),
      'endsAt': endsAt.toUtc().toIso8601String(),
      'location': location,
      'allDay': allDay,
      'description': description,
      'teachers': teachers,
      'tags': tags.map((tag) => tag.toDbMap()).toList(),
      'fields': fields?.toDbMap(),
      'exportedAt': exportedAt.toUtc().toIso8601String(),
      'userCalendarId': userCalendarId,
    };
  }
}
