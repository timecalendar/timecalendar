import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/assistant/data/assistant_steps.dart';
import 'package:timecalendar/modules/assistant/models/assistant_step.dart';
import 'package:timecalendar/modules/assistant/states/assistant_finished_result.dart';
import 'package:timecalendar/modules/assistant/states/assistant_state.dart';
import 'package:timecalendar/modules/school/models/school.dart';
import 'package:timecalendar/screens/import_ical_screen.dart';

class AssistantNotifier extends StateNotifier<AssistantState> {
  AssistantNotifier() : super(AssistantState());

  set school(School? school) {
    state = state.copyWith(school: school);
  }

  void navigateToNextStep(BuildContext context, AssistantStepEnum currentStep) {
    final nextStep = nextAssistantStep(currentStep, state);

    Navigator.of(context).pushNamed(nextStep.route).then((result) {
      if (nextStep == AssistantStepEnum.ASSISTANT && result != null)
        onAssistantFinished(context, result as AssistantFinishedResult);
    });
  }

  void onAssistantFinished(
    BuildContext context,
    AssistantFinishedResult result,
  ) {
    result.when(
      fallback: () {
        state = state.copyWith(fallback: true);
        navigateToNextStep(
          context,
          AssistantStepEnum.SELECT_SCHOOL,
        );
      },
      done: (token) => Navigator.of(context).pushNamed(
        ImportIcalScreen.routeName,
        arguments: ImportIcalScreenArguments(false),
      ),
    );
  }
}

final assistantProvider =
    StateNotifierProvider<AssistantNotifier, AssistantState>(
  (ref) => AssistantNotifier(),
);
