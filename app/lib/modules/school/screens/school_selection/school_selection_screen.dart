import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:provider/provider.dart' as provider;
import 'package:timecalendar/modules/school/controllers/school_selection_controller.dart';
import 'package:timecalendar/modules/school/models/school.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_selection_content.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_selection_header.dart';
import 'package:timecalendar/providers/assistant_provider.dart';
import 'package:timecalendar/providers/old_school_provider.dart';
import 'package:timecalendar/screens/add_school_screen.dart';
import 'package:timecalendar/screens/assistant_screen.dart';
import 'package:timecalendar/utils/snackbar.dart';

class SelectSchool extends ConsumerStatefulWidget {
  static const routeName = '/select_establishment';
  SelectSchool({Key? key}) : super(key: key);

  @override
  _SelectSchoolState createState() => _SelectSchoolState();
}

class _SelectSchoolState extends ConsumerState<SelectSchool> {
  final GlobalKey<ScaffoldState> _scaffoldKey = new GlobalKey<ScaffoldState>();
  final ScrollController _scrollController = ScrollController();

  loadSchoolAssistant() {
    provider.Provider.of<AssistantProvider>(context, listen: false)
        .initAssistant();
    Navigator.of(context).pushNamed(AddSchoolScreen.routeName);
  }

  void selectSchool(School school) {
    final assistantProvider =
        provider.Provider.of<AssistantProvider>(context, listen: false);
    assistantProvider.initBySchool(school);
    var nextScreen = assistantProvider.getAssistantStartScreen();

    Navigator.of(context).pushNamed(nextScreen).then((result) {
      if (nextScreen == AssistantScreen.routeName) {
        // Callback assistant screen
        assistantProvider.assistantCallback(
            context, result as Map<String, dynamic>?);
      }
    });
  }

  void filterSchoolList(String value) {
    var schoolProvider =
        provider.Provider.of<OLD_SchoolProvider>(context, listen: false);
    schoolProvider.filterSchool(value);
  }

  void searchFocus() {
    if (_scrollController.offset < 145) {
      _scrollController.jumpTo(145);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AsyncValue<List<School>>>(schoolSelectionControllerProvider,
        (_, value) {
      value.whenOrNull(
        error: (e, st) => showSnackBar(
          context,
          SnackBar(content: Text('Aucune connexion.')),
        ),
      );
    });

    return Scaffold(
      key: _scaffoldKey,
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(schoolSelectionControllerProvider.notifier).fetch(),
        child: CustomScrollView(
          controller: _scrollController,
          physics: AlwaysScrollableScrollPhysics(),
          slivers: <Widget>[
            SchoolSelectionHeader(
              loadSchoolAssistant: loadSchoolAssistant,
              scrollController: _scrollController,
            ),
            SchoolSelectionContent(
              onTap: searchFocus,
              onSchoolSelect: selectSchool,
              onSchoolNotFoundPressed: loadSchoolAssistant,
            ),
          ],
        ),
      ),
    );
  }
}
