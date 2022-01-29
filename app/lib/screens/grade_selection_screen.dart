import 'package:flutter/material.dart';
import 'package:flutter_sticky_header/flutter_sticky_header.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/models/grade.dart';
import 'package:timecalendar/providers/assistant_provider.dart';
import 'package:timecalendar/providers/school_provider.dart';
import 'package:timecalendar/utils/snackbar.dart';
import 'package:timecalendar/widgets/common/custom_button.dart';
import 'package:timecalendar/widgets/common/search_bar.dart';
import 'package:timecalendar/widgets/grade_selection/grade_item.dart';
import 'package:timecalendar/widgets/grade_selection/school_selected.dart';

import 'assistant_screen.dart';

enum GradeSelectionOptions { AddGrade }

class GradeSelectionScreen extends StatefulWidget {
  GradeSelectionScreen({Key key}) : super(key: key);
  static const routeName = '/grade_selection';

  @override
  _GradeSelectionScreenState createState() => _GradeSelectionScreenState();
}

class _GradeSelectionScreenState extends State<GradeSelectionScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = new GlobalKey<ScaffoldState>();
  bool _isScrollLimitReached = true;
  ScrollController _scrollController;
  final GlobalKey<RefreshIndicatorState> _refreshIndicatorKey =
      new GlobalKey<RefreshIndicatorState>();
  final TextEditingController _searchFieldController = TextEditingController();

  bool _isInit = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration.zero)
        .then((_) => _refreshIndicatorKey.currentState.show());

    _scrollController = ScrollController();
    _scrollController.addListener(() {
      final newState = _scrollController.offset <=
          (_scrollController.position.minScrollExtent + 120.0);

      if (newState != _isScrollLimitReached) {
        setState(() {
          _isScrollLimitReached = newState;
        });
      }
    });
  }

  refreshGrade() async {
    var firstLoad = !_isInit;
    if (!_isInit) {
      _isInit = true;
    }
    var schoolProvider = Provider.of<SchoolProvider>(context, listen: false);
    try {
      await schoolProvider.loadGrades();
    } on Exception catch (_) {
      if (!firstLoad)
        showSnackBar(
          context,
          SnackBar(
            content: Text('Aucune connexion.'),
          ),
        );
    }
  }

  void backToSchoolList(BuildContext ctx) {
    Navigator.pop(ctx);
  }

  loadGradeAssistant() {
    final schoolProvider = Provider.of<SchoolProvider>(context, listen: false);
    final assistantProvider =
        Provider.of<AssistantProvider>(context, listen: false);

    assistantProvider.initBySchool(schoolProvider.selectedSchool);

    var nextScreen = assistantProvider.getAssistantStartScreen();

    Navigator.of(context).pushNamed(nextScreen).then((result) {
      if (nextScreen == AssistantScreen.routeName) {
        // Callback assistant screen
        assistantProvider.assistantCallback(context, result);
      }
    });
  }

  Widget _itemBuilder(BuildContext context, int index) {
    var schoolProvider = Provider.of<SchoolProvider>(context, listen: false);
    if (index == schoolProvider.grades.length) {
      return Padding(
        padding: const EdgeInsets.all(15.0),
        child: CustomButton(
          text: 'Je ne trouve pas ma formation',
          outline: true,
          onPressed: loadGradeAssistant,
        ),
      );
    }
    return GradeItem(
      grade: schoolProvider.grades[index],
      selectGrade: selectGrade,
    );
  }

  void selectGrade(Grade grade) {
    var schoolProvider = Provider.of<SchoolProvider>(context, listen: false);
    schoolProvider.setSelectedGrade(grade);
  }

  void filterGradeList(String value) {
    var schoolProvider = Provider.of<SchoolProvider>(context, listen: false);
    schoolProvider.filterGrade(value);
  }

  void searchFocus() {
    if (_scrollController.offset < 145) {
      _scrollController.jumpTo(145);
    }
  }

  @override
  Widget build(BuildContext context) {
    var schoolProvider = Provider.of<SchoolProvider>(context);

    final mediaQuery = MediaQuery.of(context);
    final availableWidth = mediaQuery.size.width - 160;

    return Scaffold(
      key: _scaffoldKey,
      body: RefreshIndicator(
        key: _refreshIndicatorKey,
        onRefresh: () => refreshGrade(),
        child: CustomScrollView(
          controller: _scrollController,
          physics: AlwaysScrollableScrollPhysics(),
          slivers: <Widget>[
            SliverAppBar(
              pinned: true,
              actions: <Widget>[
                PopupMenuButton(
                  icon: Icon(
                    Icons.more_vert,
                  ),
                  onSelected: (GradeSelectionOptions selectedValue) {
                    switch (selectedValue) {
                      case GradeSelectionOptions.AddGrade:
                        loadGradeAssistant();
                        break;
                    }
                  },
                  tooltip: 'Menu',
                  itemBuilder: (_) => [
                    PopupMenuItem(
                      child: Text('Ajouter votre formation'),
                      value: GradeSelectionOptions.AddGrade,
                    ),
                  ],
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                title: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxWidth: availableWidth,
                  ),
                  child: Text(
                    _isScrollLimitReached
                        ? "Sélectionnez votre formation"
                        : schoolProvider.selectedSchool.name,
                    style: TextStyle(fontSize: 18),
                    overflow: _isScrollLimitReached
                        ? TextOverflow.visible
                        : TextOverflow.ellipsis,
                  ),
                ),
              ),
              expandedHeight: 200.0,
            ),
            SliverList(
              delegate: SliverChildListDelegate([
                SchoolSelected(schoolProvider.selectedSchool, null),
              ]),
            ),
            SliverStickyHeader(
              header: Container(
                padding: const EdgeInsets.all(15),
                child: SearchBar(
                  searchFieldController: _searchFieldController,
                  onChanged: filterGradeList,
                  placeholder: 'Entrez le nom de votre formation',
                  onTap: searchFocus,
                ),
                // decoration: BoxDecoration(
                //   color: ColorUtils.hexToColor('#fafafa'),
                //   border: Border(
                //     bottom: BorderSide(
                //       color: Colors.grey[100],
                //     ),
                //   ),
                // ),
              ),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  _itemBuilder,
                  childCount: schoolProvider.grades.length + 1,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
