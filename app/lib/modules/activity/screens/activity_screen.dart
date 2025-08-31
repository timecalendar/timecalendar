import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/activity/providers/activity_provider.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/shared/utils/snackbar.dart';
import 'package:timecalendar/modules/activity/widgets/difference_item.dart';
import 'package:timecalendar/modules/activity/widgets/no_activity.dart';

class ActivityScreen extends StatefulWidget {
  static const routeName = '/activity';

  @override
  _ActivityScreenState createState() => _ActivityScreenState();
}

class _ActivityScreenState extends State<ActivityScreen> {
  final GlobalKey<RefreshIndicatorState> _refreshIndicatorKey =
      new GlobalKey<RefreshIndicatorState>();
  final GlobalKey<ScaffoldState> _scaffoldKey = new GlobalKey<ScaffoldState>();
  var _isInit = false;
  var _initDone = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration.zero).then((_) => refreshActivity());
  }

  refreshActivity() async {
    var firstLoad = !_isInit;
    if (!_isInit) {
      _isInit = true;
    }
    var activityProvider = Provider.of<ActivityProvider>(
      context,
      listen: false,
    );
    var settingsProvider = Provider.of<SettingsProvider>(
      context,
      listen: false,
    );
    try {
      // Load activity
      await activityProvider.loadActivity(settingsProvider.lastActivityUpdate);
      settingsProvider.lastActivityUpdate =
          DateTime.now().toUtc().millisecondsSinceEpoch ~/ 1000;

      // Set activity as read
      settingsProvider.newActivity = false;
    } on Exception catch (_) {
      if (!firstLoad)
        showSnackBar(context, SnackBar(content: Text('Aucune connexion.')));
    } finally {
      _initDone = true;
    }
  }

  Widget _itemBuilder(BuildContext context, int index) {
    var activityProvider = Provider.of<ActivityProvider>(
      context,
      listen: false,
    );
    return DifferenceItem(difference: activityProvider.activity[index]);
  }

  @override
  Widget build(BuildContext context) {
    var activityProvider = Provider.of<ActivityProvider>(context);

    var appBar = AppBar(title: Text('Activité'));

    return Scaffold(
      key: _scaffoldKey,
      appBar: appBar,
      body: RefreshIndicator(
        key: _refreshIndicatorKey,
        child: activityProvider.activity.length > 0 || !_initDone
            ? ListView.builder(
                itemBuilder: _itemBuilder,
                itemCount: activityProvider.activity.length,
              )
            : new NoActivity(appBar: appBar),
        onRefresh: () async {
          return refreshActivity();
        },
      ),
    );
  }
}
