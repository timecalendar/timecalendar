import 'package:built_collection/built_collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/assistant/models/assistant_step.dart';
import 'package:timecalendar/modules/assistant/providers/assistant_provider.dart';
import 'package:timecalendar/modules/school/controllers/school_selection_controller.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_selection_content.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_selection_header.dart';
import 'package:timecalendar/modules/shared/utils/snackbar.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

class SelectSchool extends HookConsumerWidget {
  static const routeName = '/select_establishment';
  SelectSchool({Key? key}) : super(key: key);

  void selectSchool(
      BuildContext context, WidgetRef ref, SchoolForList? school) {
    final notifier = ref.read(assistantProvider.notifier);
    notifier.school = school;
    notifier.navigateToNextStep(context, AssistantStepEnum.SELECT_SCHOOL);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scrollController = useScrollController();

    ref.listen<AsyncValue<BuiltList<SchoolForList>>>(
        schoolSelectionControllerProvider, (_, value) {
      value.whenOrNull(
        error: (e, st) => showSnackBar(
          context,
          SnackBar(content: Text('Aucune connexion.')),
        ),
      );
    });

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(schoolSelectionControllerProvider.notifier).fetch(),
        child: CustomScrollView(
          controller: scrollController,
          physics: AlwaysScrollableScrollPhysics(),
          slivers: <Widget>[
            SchoolSelectionHeader(
              loadSchoolAssistant: () => selectSchool(context, ref, null),
              scrollController: scrollController,
            ),
            SchoolSelectionContent(
              onTap: () {
                if (scrollController.offset < 145) scrollController.jumpTo(145);
              },
              onSchoolSelect: (school) => selectSchool(context, ref, school),
              onSchoolNotFoundPressed: () => selectSchool(context, ref, null),
            ),
          ],
        ),
      ),
    );
  }
}
