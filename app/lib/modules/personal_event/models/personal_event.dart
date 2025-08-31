import 'package:flutter/material.dart' as material;
import 'package:built_value/built_value.dart';
import 'package:timecalendar/modules/calendar/models/event_interface.dart';
import 'package:timecalendar/modules/calendar/models/event_tag.dart';
import 'package:timecalendar/modules/shared/utils/color_utils.dart';

part 'personal_event.g.dart';

abstract class PersonalEvent
    implements EventInterface, Built<PersonalEvent, PersonalEventBuilder> {
  String get uid;
  String get title;
  material.Color get color;
  DateTime get startsAt;
  DateTime get endsAt;
  String? get location;
  String? get description;
  DateTime get exportedAt;
  EventKind get kind => EventKind.Personal;

  PersonalEvent._();
  factory PersonalEvent([updates(PersonalEventBuilder b)]) = _$PersonalEvent;

  material.Color get groupColor => color;
  List<EventTag> get tags => [];
  List<String> get teachers => [];

  factory PersonalEvent.fromInternalDb(Map<String, dynamic> map) {
    return PersonalEvent(
      (event) => event
        ..uid = map['uid']
        ..title = map['title']
        ..color = ColorUtils.hexToColor(map['color'])
        ..startsAt = DateTime.parse(map['startsAt']).toLocal()
        ..endsAt = DateTime.parse(map['endsAt']).toLocal()
        ..location = map['location']
        ..description = map['description']
        ..exportedAt = DateTime.parse(map['exportedAt']).toLocal(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'title': title,
      'color': ColorUtils.colorToHex(color),
      'startsAt': startsAt.toUtc().toIso8601String(),
      'endsAt': endsAt.toUtc().toIso8601String(),
      'location': location,
      'description': description,
      'exportedAt': exportedAt.toUtc().toIso8601String(),
    };
  }
}
