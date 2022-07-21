import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/school/controllers/school_selection_controller.dart';
import 'package:timecalendar/modules/school/models/school.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_item.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_not_found_button.dart';

class SchoolList extends HookConsumerWidget {
  final Function(School) onSchoolSelect;
  final Function onSchoolNotFoundPressed;

  const SchoolList({
    Key? key,
    required this.onSchoolSelect,
    required this.onSchoolNotFoundPressed,
  }) : super(key: key);

  Widget _itemBuilder(School school) {
    return SchoolItem(
      school: school,
      onSchoolSelect: onSchoolSelect,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schools = ref.watch(schoolSelectionControllerProvider);
    final filtered = ref.watch(schoolFilteredProvider);

    schools.whenOrNull(error: (err, stack) {
      print(err);
      print(stack);
    });

    return schools.when(
      data: (_) => SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) => index == filtered.length
              ? SchoolNotFoundButton(onPressed: onSchoolNotFoundPressed)
              : _itemBuilder(filtered[index]),
          childCount: filtered.length + 1,
        ),
      ),
      error: (err, stack) => SliverToBoxAdapter(),
      loading: () => SliverToBoxAdapter(
        child: Center(
          child: CircularProgressIndicator(),
        ),
      ),
    );
  }
}
