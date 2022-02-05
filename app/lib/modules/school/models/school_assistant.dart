import 'package:freezed_annotation/freezed_annotation.dart';

part 'school_assistant.freezed.dart';
part 'school_assistant.g.dart';

@freezed
class SchoolAssistant with _$SchoolAssistant {
  factory SchoolAssistant({
    required String slug,
    required bool isNative,
    required bool requireIntranetAccess,
    required bool requireCalendarName,
  }) = _SchoolAssistant;

  factory SchoolAssistant.fromJson(Map<String, dynamic> json) =>
      _$SchoolAssistantFromJson(json);
}
