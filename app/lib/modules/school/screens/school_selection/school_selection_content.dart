import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_sticky_header/flutter_sticky_header.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/school/controllers/school_selection_controller.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_list.dart';
import 'package:timecalendar/modules/shared/widgets/ui/search_bar.dart';
import 'package:timecalendar_api/timecalendar_api.dart';

class SchoolSelectionContent extends HookConsumerWidget {
  final Function onSchoolNotFoundPressed;
  final Function(SchoolForList) onSchoolSelect;
  final Function onTap;

  const SchoolSelectionContent({
    Key? key,
    required this.onSchoolNotFoundPressed,
    required this.onSchoolSelect,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = useTextEditingController();

    return SliverStickyHeader(
      header: Container(
        padding: EdgeInsets.all(15),
        child: SearchBar(
          searchFieldController: controller,
          onChanged: (text) =>
              ref.read(schoolSearchProvider.notifier).state = text,
          placeholder: 'Rechercher un établissement',
          onTap: this.onTap,
        ),
      ),
      sliver: SchoolList(
        onSchoolSelect: onSchoolSelect,
        onSchoolNotFoundPressed: onSchoolNotFoundPressed,
      ),
    );
  }
}
