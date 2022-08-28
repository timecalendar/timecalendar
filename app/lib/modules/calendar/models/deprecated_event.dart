import 'dart:convert';
import 'dart:ui';

import 'package:timecalendar/modules/calendar/models/event_tag.dart';
import 'package:timecalendar/modules/shared/utils/color_utils.dart';

class DeprecatedEvent {
  final String? uid;
  final String? title;
  final DateTime start;
  final DateTime end;
  final DateTime? exportedAt;
  final String? location;
  final String? description;
  final String? shortDescription;
  final Color? color;
  final Color groupColor;
  final int? unitId;
  final List<String> teachers;
  final List<EventTag> tags;
  int completedNotes = 0;
  int totalNotes = 0;

  DeprecatedEvent({
    required this.uid,
    required this.title,
    required this.start,
    required this.end,
    required this.exportedAt,
    required this.location,
    required this.description,
    required this.shortDescription,
    required this.color,
    required this.groupColor,
    required this.unitId,
    required this.teachers,
    required this.tags,
    this.completedNotes = 0,
    this.totalNotes = 0,
  });

  DeprecatedEvent.fromDb(Map<String, dynamic> map)
      : uid = map['uid'],
        title = map['title'],
        start = DateTime.parse(map['start']),
        end = DateTime.parse(map['end']),
        exportedAt = (map['exportedAt'] != null)
            ? DateTime.parse(map['exportedAt'])
            : null,
        location = map['location'],
        description = map['description'],
        shortDescription = map['shortDescription'],
        color = ColorUtils.hexToColor(map['color']),
        groupColor = ColorUtils.hexToColor(map['groupColor']),
        unitId = map['unitId'],
        teachers = List<String>.from(jsonDecode(map['teachers'])),
        tags = [];

  factory DeprecatedEvent.fromApi(Map<String, dynamic> event) {
    return DeprecatedEvent(
      uid: event['uid'],
      title: event['title'],
      start: DateTime.fromMillisecondsSinceEpoch(event['start']),
      end: DateTime.fromMillisecondsSinceEpoch(event['end']),
      exportedAt: (event['exportedAt'] != null)
          ? DateTime.fromMillisecondsSinceEpoch(event['exportedAt'])
          : null,
      description: event['description'],
      location: event['location'],
      shortDescription: event['shortDescription'],
      color: ColorUtils.hexToColor(event['backgroundColor']),
      groupColor: ColorUtils.hexToColor(event['groupColor']),
      unitId: event['unit_id'],
      teachers: List<String>.from(event['teachers'] ?? []),
      tags: [],
    );
  }

  get startHour {
    return start.hour + (start.minute * 10 / 6) / 100;
  }

  get endHour {
    return end.hour + (end.minute * 10 / 6) / 100;
  }

  Map<String, dynamic> toMap() {
    var map = Map<String, dynamic>();
    map['uid'] = uid;
    map['title'] = title;
    map['start'] = start.toIso8601String();
    map['end'] = end.toIso8601String();
    map['exportedAt'] =
        (exportedAt != null) ? exportedAt!.toIso8601String() : null;
    map['location'] = location;
    map['description'] = description;
    map['shortDescription'] = shortDescription;
    map['color'] = ColorUtils.colorToHex(color!);
    map['groupColor'] = ColorUtils.colorToHex(groupColor);
    map['unitId'] = unitId;
    map['teachers'] = jsonEncode(teachers);
    map['tags'] = jsonEncode(List.from(tags.map((tag) => tag.toDbMap())));
    return map;
  }

  bool isOverlap(DeprecatedEvent event) {
    return this.start.isBefore(event.end) && event.start.isBefore(this.end);
  }

  @override
  String toString() {
    return toMap().toString();
  }
}
