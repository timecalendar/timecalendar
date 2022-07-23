import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

part 'assistant_state.freezed.dart';

@freezed
class AssistantState with _$AssistantState {
  factory AssistantState({
    @Default(null) SchoolForList? school,
    @Default(false) bool fallback,
  }) = _AssistantState;
  AssistantState._();

  SchoolAssistant get assistant {
    if (school == null) {
      return SchoolAssistant((assistant) => assistant
        ..isNative = false
        ..requireCalendarName = true
        ..requireIntranetAccess = false
        ..slug = "generic");
    }
    if (fallback && school!.fallbackAssistant != null) {
      return school!.fallbackAssistant!;
    }
    return school!.assistant;
  }
}
