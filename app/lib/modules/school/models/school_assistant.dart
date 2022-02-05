import 'package:json_annotation/json_annotation.dart';

part 'school_assistant.g.dart';

@JsonSerializable()
class SchoolAssistant {
  final String slug;
  final bool isNative;
  final bool requireIntranetAccess;
  final bool requireCalendarName;

  SchoolAssistant({
    required this.slug,
    required this.isNative,
    required this.requireIntranetAccess,
    required this.requireCalendarName,
  });

  factory SchoolAssistant.fromJson(Map<String, dynamic> json) =>
      _$SchoolAssistantFromJson(json);

  Map<String, dynamic> toJson() => _$SchoolAssistantToJson(this);
}
