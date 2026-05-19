import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/calendar_event.dart';
import 'package:timecalendar/modules/calendar/models/calendar_event_custom_fields.dart';
import 'package:timecalendar/modules/calendar/models/event_tag.dart';
import 'package:timecalendar_api/timecalendar_api.dart'
    show FindSchoolsRepDto, SchoolAssistant, SchoolForList;

/// Shared domain-object builders for tests.
///
/// Each builder fills every required field with a sane default and exposes
/// those fields as named parameters so a test only states what it cares about.
/// Test-only — this file lives under `test/support/` and is never shipped.

/// Builds a [CalendarEvent] (which implements `EventInterface`), so it doubles
/// as the fixture for the calendar helper and `EventForUI` tests.
CalendarEvent buildCalendarEvent({
  String uid = 'event-1',
  String title = 'Cours de mathématiques',
  Color color = const Color(0xFF3A7BD5),
  Color groupColor = const Color(0xFFE66B9A),
  DateTime? startsAt,
  DateTime? endsAt,
  String? location = 'Salle A1',
  bool allDay = false,
  String? description = 'Chapitre 3',
  List<String>? teachers,
  List<EventTag>? tags,
  CalendarEventCustomFields? fields,
  DateTime? exportedAt,
  String userCalendarId = 'calendar-1',
}) {
  return CalendarEvent(
    uid: uid,
    title: title,
    color: color,
    groupColor: groupColor,
    startsAt: startsAt ?? DateTime(2024, 1, 1, 9, 0),
    endsAt: endsAt ?? DateTime(2024, 1, 1, 10, 0),
    location: location,
    allDay: allDay,
    description: description,
    teachers: teachers ?? const ['M. Dupont'],
    tags: tags ?? const [],
    fields: fields,
    exportedAt: exportedAt ?? DateTime(2024, 1, 1, 8, 0),
    userCalendarId: userCalendarId,
  );
}

/// Builds a built_value [SchoolForList], including its required nested
/// [SchoolAssistant].
SchoolForList buildSchoolForList({
  String id = 'school-1',
  String code = 'TC',
  String name = 'TimeCalendar University',
  String slug = 'native',
  String imageUrl = 'https://example.com/logo.png',
}) {
  final assistant = SchoolAssistant(
    (b) => b
      ..slug = slug
      ..requireIntranetAccess = false
      ..requireCalendarName = false
      ..isNative = true,
  );

  return SchoolForList(
    (b) => b
      ..id = id
      ..code = code
      ..name = name
      ..siteUrl = 'https://example.com'
      ..imageUrl = imageUrl
      ..visible = true
      ..createdAt = DateTime.utc(2024, 1, 1)
      ..updatedAt = DateTime.utc(2024, 1, 1)
      ..assistant.replace(assistant),
  );
}

/// Wraps [schools] in a [FindSchoolsRepDto] — the payload of `findSchools()`.
FindSchoolsRepDto buildFindSchoolsRep(List<SchoolForList> schools) {
  return FindSchoolsRepDto((b) => b..schools.replace(schools));
}
