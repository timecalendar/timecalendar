import 'package:timecalendar/modules/assistant/models/assistant_step.dart';
import 'package:timecalendar/modules/assistant/states/assistant_state.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_selection_screen.dart';
import 'package:timecalendar/modules/add_grade/screens/add_grade_screen.dart';
import 'package:timecalendar/modules/add_school/screens/add_school_screen.dart';
import 'package:timecalendar/screens/assistant_screen.dart';
import 'package:timecalendar/screens/connect_screen.dart';

final assistantSteps = [
  AssistantStep(
    step: AssistantStepEnum.SELECT_SCHOOL,
    predicate: (_) => true,
    route: SelectSchool.routeName,
  ),
  AssistantStep(
    step: AssistantStepEnum.ADD_SCHOOL,
    predicate: (state) => state.school == null,
    route: AddSchoolScreen.routeName,
  ),
  AssistantStep(
    step: AssistantStepEnum.ADD_GRADE,
    predicate: (state) => state.assistant.requireCalendarName,
    route: AddGradeScreen.routeName,
  ),
  AssistantStep(
    step: AssistantStepEnum.CONNECT_TO_INTRANET,
    predicate: (state) => state.assistant.requireIntranetAccess,
    route: ConnectScreen.routeName,
  ),
  AssistantStep(
    step: AssistantStepEnum.ASSISTANT,
    predicate: (_) => true,
    route: AssistantScreen.routeName,
  ),
];

AssistantStep nextAssistantStep(
  AssistantStepEnum currentStep,
  AssistantState state,
) {
  final index =
      assistantSteps.indexWhere((element) => element.step == currentStep);
  final nextSteps = assistantSteps.sublist(index + 1);

  return nextSteps.firstWhere(
    (step) => step.predicate(state),
    orElse: () => throw Exception(),
  );
}
