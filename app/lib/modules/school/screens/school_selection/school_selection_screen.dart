import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_sticky_header/flutter_sticky_header.dart';
import 'package:provider/provider.dart' as provider;
import 'package:timecalendar/modules/school/models/school.dart';
import 'package:timecalendar/modules/school/providers/school_selection_provider.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_list.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_selection_header.dart';
import 'package:timecalendar/providers/assistant_provider.dart';
import 'package:timecalendar/providers/old_school_provider.dart';
import 'package:timecalendar/screens/add_school_screen.dart';
import 'package:timecalendar/utils/snackbar.dart';
import 'package:timecalendar/widgets/common/search_bar.dart';
import 'package:timecalendar/screens/assistant_screen.dart';

class SelectSchool extends ConsumerStatefulWidget {
  static const routeName = '/select_establishment';
  SelectSchool({Key? key}) : super(key: key);

  @override
  _SelectSchoolState createState() => _SelectSchoolState();
}

class _SelectSchoolState extends ConsumerState<SelectSchool> {
  final GlobalKey<ScaffoldState> _scaffoldKey = new GlobalKey<ScaffoldState>();
  final GlobalKey<RefreshIndicatorState> _refreshIndicatorKey =
      new GlobalKey<RefreshIndicatorState>();
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchFieldController = TextEditingController();

  refreshSchool() async {
    final schoolList = ref.refresh(schoolListProvider);

    schoolList.whenOrNull(
      error: (err, stack) => showSnackBar(
        context,
        SnackBar(
          content: Text('Aucune connexion.'),
        ),
      ),
    );
  }

  loadSchoolAssistant() {
    provider.Provider.of<AssistantProvider>(context, listen: false)
        .initAssistant();
    Navigator.of(context).pushNamed(AddSchoolScreen.routeName);
  }

  loadGradeAssistant(School school) {
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

  void selectSchool(School school) {
    loadGradeAssistant(school);
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
    return Scaffold(
      key: _scaffoldKey,
      body: RefreshIndicator(
        key: _refreshIndicatorKey,
        onRefresh: () => refreshSchool(),
        child: CustomScrollView(
          controller: _scrollController,
          physics: AlwaysScrollableScrollPhysics(),
          slivers: <Widget>[
            SchoolSelectionHeader(
              loadSchoolAssistant: loadSchoolAssistant,
              scrollController: _scrollController,
            ),
            SliverStickyHeader(
              header: Container(
                padding: EdgeInsets.all(15),
                child: SearchBar(
                  searchFieldController: _searchFieldController,
                  onChanged: filterSchoolList,
                  placeholder: 'Rechercher un établissement',
                  onTap: searchFocus,
                ),
              ),
              sliver: SchoolList(),
            ),
          ],
        ),
      ),
    );
  }
}
