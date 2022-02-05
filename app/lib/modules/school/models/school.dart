import 'package:json_annotation/json_annotation.dart';
import 'package:timecalendar/modules/school/models/school_assistant.dart';

part 'school.g.dart';

@JsonSerializable()
class School {
  final String code;
  final String name;
  final String siteUrl;
  final String imageUrl;
  final bool visible;
  final String? intranetUrl;
  final SchoolAssistant assistant;
  final SchoolAssistant? fallbackAssistant;

  School({
    required this.code,
    required this.name,
    required this.siteUrl,
    required this.imageUrl,
    required this.visible,
    required this.intranetUrl,
    required this.assistant,
    required this.fallbackAssistant,
  });

  factory School.fromJson(Map<String, dynamic> json) => _$SchoolFromJson(json);

  Map<String, dynamic> toJson() => _$SchoolToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }
}
