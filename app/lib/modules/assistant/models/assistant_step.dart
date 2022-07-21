import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:timecalendar/modules/assistant/states/assistant_state.dart';

part 'assistant_step.freezed.dart';

enum AssistantStepEnum {
  SELECT_SCHOOL,
  ADD_SCHOOL,
  ADD_GRADE,
  CONNECT_TO_INTRANET,
  ASSISTANT,
}

@freezed
class AssistantStep with _$AssistantStep {
  factory AssistantStep({
    required AssistantStepEnum step,
    required bool Function(AssistantState) predicate,
    required String route,
  }) = _AssistantStep;
}
