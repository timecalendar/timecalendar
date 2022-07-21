import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:timecalendar/modules/school/models/school.dart';
import 'package:timecalendar/modules/school/models/school_assistant.dart';

part 'assistant_state.freezed.dart';

@freezed
class AssistantState with _$AssistantState {
  factory AssistantState({
    @Default(null) School? school,
    @Default(false) bool fallback,
  }) = _AssistantState;
  AssistantState._();

  SchoolAssistant get assistant {
    if (school == null) {
      return new SchoolAssistant(
        slug: 'generic',
        isNative: false,
        requireCalendarName: true,
        requireIntranetAccess: false,
      );
    }
    if (fallback && school!.fallbackAssistant != null) {
      return school!.fallbackAssistant!;
    }
    return school!.assistant;
  }
}
