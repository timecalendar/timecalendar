import 'package:flutter/material.dart';
import 'package:flutter_sticky_header/flutter_sticky_header.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/school/models/school.dart';
import 'package:timecalendar/providers/assistant_provider.dart';
import 'package:timecalendar/providers/old_school_provider.dart';
import 'package:timecalendar/screens/add_school_screen.dart';
import 'package:timecalendar/utils/snackbar.dart';
import 'package:timecalendar/widgets/common/custom_button.dart';
import 'package:timecalendar/widgets/common/search_bar.dart';
import 'package:timecalendar/widgets/school_selection/school_item.dart';
import '../../../screens/assistant_screen.dart';
import '../../../screens/import_ical_screen.dart';

enum SchoolSelectionOptions { AddSchool, ImportIcal }

class SelectSchool extends StatefulWidget {
  static const routeName = '/select_establishment';
  SelectSchool({Key? key}) : super(key: key);

  @override
  _SelectSchoolState createState() => _SelectSchoolState();
}

class _SelectSchoolState extends State<SelectSchool> {
  final GlobalKey<ScaffoldState> _scaffoldKey = new GlobalKey<ScaffoldState>();
  final GlobalKey<RefreshIndicatorState> _refreshIndicatorKey =
      new GlobalKey<RefreshIndicatorState>();
  final TextEditingController _searchFieldController = TextEditingController();
  bool _isScrollLimitReached = true;
  ScrollController? _scrollController;

  bool _isInit = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration.zero)
        .then((_) => _refreshIndicatorKey.currentState!.show());

    _scrollController = ScrollController();
    _scrollController!.addListener(() {
      final newState = _scrollController!.offset <=
          (_scrollController!.position.minScrollExtent + 120.0);

      if (newState != _isScrollLimitReached) {
        setState(() {
          _isScrollLimitReached = newState;
        });
      }
    });
  }

  refreshSchool() async {
    var firstLoad = !_isInit;
    if (!_isInit) {
      _isInit = true;
    }
    var schoolProvider =
        Provider.of<OLD_SchoolProvider>(context, listen: false);
    try {
      await schoolProvider.loadSchools();
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

  loadSchoolAssistant() {
    Provider.of<AssistantProvider>(context, listen: false).initAssistant();
    Navigator.of(context).pushNamed(AddSchoolScreen.routeName);
  }

  loadGradeAssistant(School school) {
    final assistantProvider =
        Provider.of<AssistantProvider>(context, listen: false);
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

  Widget _itemBuilder(BuildContext context, int index) {
    var schoolProvider =
        Provider.of<OLD_SchoolProvider>(context, listen: false);
    if (index == schoolProvider.schools.length) {
      return Padding(
        padding: const EdgeInsets.all(15.0),
        child: CustomButton(
          text: 'Je ne trouve pas mon établissement',
          outline: true,
          onPressed: loadSchoolAssistant,
        ),
      );
    }
    return SchoolItem(
        school: schoolProvider.schools[index], selection: selectSchool);
  }

  void selectSchool(School school) {
    var schoolProvider =
        Provider.of<OLD_SchoolProvider>(context, listen: false);
    schoolProvider.setSelectedSchool(school);
    loadGradeAssistant(school);
  }

  void filterSchoolList(String value) {
    var schoolProvider =
        Provider.of<OLD_SchoolProvider>(context, listen: false);
    schoolProvider.filterSchool(value);
  }

  void back(BuildContext ctx) {
    Navigator.pop(ctx);
  }

  void searchFocus() {
    if (_scrollController!.offset < 145) {
      _scrollController!.jumpTo(145);
    }
  }

  @override
  Widget build(BuildContext context) {
    var schoolProvider = Provider.of<OLD_SchoolProvider>(context);

    final mediaQuery = MediaQuery.of(context);
    final availableWidth = mediaQuery.size.width - 160;

    return Scaffold(
      key: _scaffoldKey,
      body: RefreshIndicator(
        key: _refreshIndicatorKey,
        onRefresh: () => refreshSchool(),
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
                  onSelected: (SchoolSelectionOptions selectedValue) {
                    switch (selectedValue) {
                      case SchoolSelectionOptions.AddSchool:
                        loadSchoolAssistant();
                        break;
                      case SchoolSelectionOptions.ImportIcal:
                        Navigator.of(context).pushNamed(
                            ImportIcalScreen.routeName,
                            arguments: ImportIcalScreenArguments(true));
                        break;
                    }
                  },
                  tooltip: 'Menu',
                  itemBuilder: (_) => [
                    PopupMenuItem(
                      child: Text('Ajouter votre établissement'),
                      value: SchoolSelectionOptions.AddSchool,
                    ),
                    PopupMenuItem(
                      child: Text('Scanner un QR code'),
                      value: SchoolSelectionOptions.ImportIcal,
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
                        ? "Sélectionnez votre établissement"
                        : "Établissement",
                    style: TextStyle(fontSize: 18),
                    overflow: _isScrollLimitReached
                        ? TextOverflow.visible
                        : TextOverflow.ellipsis,
                  ),
                ),
              ),
              expandedHeight: 200.0,
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
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  _itemBuilder,
                  childCount: schoolProvider.schools.length + 1,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
