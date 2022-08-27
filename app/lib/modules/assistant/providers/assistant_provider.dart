import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/assistant/data/assistant_steps.dart';
import 'package:timecalendar/modules/assistant/models/assistant_step.dart';
import 'package:timecalendar/modules/assistant/states/assistant_finished_result.dart';
import 'package:timecalendar/modules/assistant/states/assistant_state.dart';
import 'package:timecalendar/modules/import_ical/screens/import_ical/import_ical_screen.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

class AssistantNotifier extends StateNotifier<AssistantState> {
  AssistantNotifier() : super(AssistantState());

  set school(SchoolForList? school) {
    state = state.copyWith(school: school);
  }

  void navigateToNextStep(BuildContext context, AssistantStepEnum currentStep) {
    final nextStep = nextAssistantStep(currentStep, state);

    Navigator.of(context).pushNamed(nextStep.route).then((result) {
      if (nextStep.step == AssistantStepEnum.ASSISTANT && result != null)
        onAssistantFinished(context, result as AssistantFinishedResult);
    });
  }

  void onAssistantFinished(
    BuildContext context,
    AssistantFinishedResult result,
  ) {
    result.when(fallback: () {
      state = state.copyWith(fallback: true);
      navigateToNextStep(
        context,
        AssistantStepEnum.SELECT_SCHOOL,
      );
    }, done: () {
      Navigator.of(context).pushNamed(
        ImportIcalScreen.routeName,
        arguments: ImportIcalScreenArguments(false),
      );
    });
  }
}

final assistantProvider =
    StateNotifierProvider<AssistantNotifier, AssistantState>(
  (ref) => AssistantNotifier(),
);
