import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_sticky_header/flutter_sticky_header.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/database/differences_manager.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/providers/school_provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/screens/tabs_screen.dart';
import 'package:timecalendar/services/notification/notification.dart';
import 'package:timecalendar/utils/snackbar.dart';
import 'package:timecalendar/widgets/common/custom_button.dart';
import 'package:timecalendar/widgets/common/search_bar.dart';
import 'package:timecalendar/widgets/grade_selection/school_selected.dart';

class UnitsSelectionScreen extends StatefulWidget {
  UnitsSelectionScreen({Key key}) : super(key: key);
  static const routeName = '/unit_selection';

  @override
  _UnitsSelectionScreenState createState() => _UnitsSelectionScreenState();
}

class _UnitsSelectionScreenState extends State<UnitsSelectionScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = new GlobalKey<ScaffoldState>();
  bool _isScrollLimitReached = true;
  ScrollController _scrollController;

  final GlobalKey<RefreshIndicatorState> _refreshIndicatorKey =
      new GlobalKey<RefreshIndicatorState>();
  final TextEditingController _searchFieldController = TextEditingController();
  String currentGroup = '';

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

  refreshUnit() async {
    var firstLoad = !_isInit;
    if (!_isInit) {
      _isInit = true;
    }
    var schoolProvider = Provider.of<SchoolProvider>(context, listen: false);
    try {
      await schoolProvider.loadUnits();
    } on Exception {
      if (!firstLoad)
        showSnackBar(
          context,
          SnackBar(
            content: Text('Aucune connexion.'),
          ),
        );
    }
  }

  void backToGradeList(BuildContext ctx) {
    Navigator.pop(ctx);
  }

  Widget _itemBuilder(BuildContext context, int index) {
    var schoolProvider = Provider.of<SchoolProvider>(context, listen: false);
    return schoolProvider.units[index].buildItem(context);
  }

  void filterUnitList(String value) {
    var schoolProvider = Provider.of<SchoolProvider>(context, listen: false);
    schoolProvider.filterUnits(filter: value);
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
      body: Container(
        child: Column(
          children: <Widget>[
            Expanded(
              child: RefreshIndicator(
                key: _refreshIndicatorKey,
                onRefresh: () => refreshUnit(),
                child: CustomScrollView(
                  controller: _scrollController,
                  physics: AlwaysScrollableScrollPhysics(),
                  slivers: <Widget>[
                    SliverAppBar(
                      pinned: true,
                      systemOverlayStyle: SystemUiOverlayStyle(
                          statusBarBrightness: Brightness.dark),
                      flexibleSpace: FlexibleSpaceBar(
                        title: ConstrainedBox(
                          constraints: BoxConstraints(
                            maxWidth: availableWidth,
                          ),
                          child: Text(
                            _isScrollLimitReached
                                ? "Sélectionnez vos\ngroupes"
                                : schoolProvider.selectedGrade.name,
                            style: TextStyle(fontSize: 18),
                            softWrap: false,
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
                        SchoolSelected(
                          schoolProvider.selectedSchool,
                          schoolProvider.selectedGrade,
                        ),
                      ]),
                    ),
                    SliverStickyHeader(
                      header: Container(
                        padding: const EdgeInsets.all(15),
                        child: SearchBar(
                          searchFieldController: _searchFieldController,
                          onChanged: filterUnitList,
                          placeholder: 'Rechercher...',
                          onTap: searchFocus,
                        ),
                      ),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          _itemBuilder,
                          childCount: schoolProvider.units.length,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (schoolProvider.selectedUnits.length > 0)
              new UnitBottomDisplay(),
          ],
        ),
      ),
    );
  }
}

class UnitBottomDisplay extends StatefulWidget {
  UnitBottomDisplay({
    Key key,
  }) : super(key: key);

  @override
  _UnitBottomDisplayState createState() => _UnitBottomDisplayState();
}

class _UnitBottomDisplayState extends State<UnitBottomDisplay> {
  bool loading = false;

  String getSelectedUnitsName(context) {
    var schoolProvider = Provider.of<SchoolProvider>(context, listen: false);
    String txt =
        schoolProvider.selectedUnits.map((unit) => unit.name).join(", ");

    return txt;
  }

  @override
  Widget build(BuildContext context) {
    var schoolProvider = Provider.of<SchoolProvider>(context, listen: false);
    var settingsProvider = Provider.of<SettingsProvider>(context);

    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
        color: Theme.of(context).colorScheme.secondary,
        width: double.infinity,
        height: 100,
        child: Row(
          children: <Widget>[
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(
                    'Vos groupes',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      fontSize: 18,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    getSelectedUnitsName(context),
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.black,
                    ),
                    overflow: TextOverflow.ellipsis,
                  )
                ],
              ),
            ),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                CustomButton(
                  text: 'Valider',
                  outline: true,
                  backgroundColor: Colors.white,
                  loading: loading,
                  onPressed: () async {
                    setState(() {
                      loading = true;
                    });

                    // Save units
                    await schoolProvider.saveSelectedUnits();

                    // Delete all differences
                    await DifferencesManager().deleteAll();
                    settingsProvider.lastActivityUpdate = 0;

                    // Refresh calendar
                    await Provider.of<EventsProvider>(context, listen: false)
                        .fetchAndSetEvents();

                    Navigator.of(context).pushNamedAndRemoveUntil(
                        TabsScreen.routeName, (Route<dynamic> route) => false);

                    Future.delayed(Duration(seconds: 1)).then((_) {
                      NotificationService().subscribe();
                    });
                  },
                )
              ],
            )
          ],
        ),
      ),
    );
  }
}
