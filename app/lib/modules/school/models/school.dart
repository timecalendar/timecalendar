import 'package:timecalendar/models/school_assistant.dart';

class School {
  final String? code;
  final String? name;
  final String? siteurl;
  final bool visible;
  final int? nbGrades;
  final String? calendarUrl;
  final SchoolAssistant? assistant;
  final SchoolAssistant? fallbackAssistant;

  School({
    required this.code,
    required this.name,
    required this.siteurl,
    required this.visible,
    required this.nbGrades,
    required this.calendarUrl,
    required this.assistant,
    required this.fallbackAssistant,
  });

  factory School.fromInternalDb(Map<String, dynamic> dbMap) {
    Map<String, dynamic> map = Map.from(dbMap);
    return School(
      code: map['code'],
      name: map['name'],
      siteurl: map['siteurl'],
      visible: (map['visible'] == 1) ? true : false,
      nbGrades: map['nbGrades'],
      calendarUrl: map['calendarUrl'],
      assistant: (map['assistant'] == null)
          ? null
          : SchoolAssistant.fromInternalDb(map['assistant']),
      fallbackAssistant: (map['fallbackAssistant'] == null)
          ? null
          : SchoolAssistant.fromInternalDb(map['fallbackAssistant']),
    );
  }

  factory School.oldFromApi(Map<String, dynamic> map) {
    return School(
      code: map['code'],
      name: map['name'],
      siteurl: map['siteurl'],
      visible: (map['visible'] == 1) ? true : false,
      nbGrades: map['nbGrades'],
      calendarUrl: map['calendar_url'],
      assistant: (map['assistant'] == null)
          ? null
          : SchoolAssistant.fromApi(map['assistant']),
      fallbackAssistant: (map['fallback_assistant'] == null)
          ? null
          : SchoolAssistant.fromApi(map['fallback_assistant']),
    );
  }

  Map<String, dynamic> toMap() {
    Map<String, dynamic> map = {
      'code': code,
      'name': name,
      'siteurl': siteurl,
      'visible': visible,
      'nbGrades': nbGrades,
      'calendarUrl': calendarUrl,
      'assistant': assistant?.toMap(),
      'fallbackAssistant': fallbackAssistant?.toMap(),
    };
    return map;
  }

  @override
  String toString() {
    return toMap().toString();
  }
}
