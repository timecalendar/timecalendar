import 'package:flutter/material.dart';
import 'package:timecalendar/modules/calendar/models/event_tag.dart';

enum EventKind { Calendar, Personal }

abstract class EventInterface {
  String get uid;
  String get title;
  DateTime get startsAt;
  DateTime get endsAt;
  String? get location;
  String? get description;
  Color get color;
  Color get groupColor;
  List<EventTag> get tags;
  List<String> get teachers;
  DateTime get exportedAt;
  EventKind get kind;
  String? get userCalendarId;
}
