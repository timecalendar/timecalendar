import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/school/models/school.dart';
import 'package:timecalendar/modules/school/providers/school_selection_provider.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_item.dart';

class SchoolList extends HookConsumerWidget {
  const SchoolList({Key? key}) : super(key: key);

  Widget _itemBuilder(School school) {
    return SchoolItem(school: school, selection: () {});
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schools = ref.watch(schoolListProvider);

    schools.whenOrNull(error: (err, stack) {
      print(err);
      print(stack);
    });

    return schools.when(
      data: (schools) => SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) => _itemBuilder(schools[index]),
          childCount: schools.length,
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
