import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:timecalendar/modules/school/models/school_assistant.dart';

part 'school.freezed.dart';
part 'school.g.dart';

@freezed
class School with _$School {
  const School._();
  factory School({
    required String code,
    required String name,
    required String siteUrl,
    required String imageUrl,
    required bool visible,
    required String? intranetUrl,
    required SchoolAssistant assistant,
    required SchoolAssistant? fallbackAssistant,
  }) = _School;

  factory School.fromJson(Map<String, dynamic> json) => _$SchoolFromJson(json);

  @override
  String toString() {
    return toJson().toString();
  }
}
