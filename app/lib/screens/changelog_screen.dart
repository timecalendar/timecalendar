import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/models/changelog.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/utils/constants.dart';
import 'package:timecalendar/widgets/changelog/changelog_item_header.dart';
import 'package:timecalendar/widgets/changelog/changelog_item_new_features.dart';
import 'package:timecalendar/widgets/common/custom_button.dart';

class ChangelogScreen extends StatefulWidget {
  static const routeName = '/changelog';

  @override
  _ChangelogScreenState createState() => _ChangelogScreenState();
}

class _ChangelogScreenState extends State<ChangelogScreen> {
  List<Changelog> changelogList;
  List<Widget> changelogWidgets = [];

  @override
  void initState() {
    super.initState();

    Future.delayed(Duration.zero, () {
      final Map<String, dynamic> args =
          ModalRoute.of(context).settings.arguments;
      // When called from the about page, the changelog screen should display
      // all changelogs
      var displayAllChangelog = false;
      if (args != null &&
          args.containsKey('displayAllChangelog') &&
          args['displayAllChangelog']) {
        displayAllChangelog = true;
      }
      getChangelogList(displayAllChangelog);
      generateWidgetsChangelog();
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
  }

  void generateWidgetsChangelog() {
    List<Widget> tmp = [];
    for (var item in changelogList) {
      tmp.add(Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32.0),
        child: ChangelogItemHeader(
          changelog: item,
        ),
      ));
      for (var features in item.changelogItems) {
        tmp.add(Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: ChangelogItemNewFeatures(
            changelogItem: features,
          ),
        ));
      }
      tmp.add(Divider());
    }

    setState(() {
      changelogWidgets = List.from(tmp);
    });
  }

  Widget _itemBuilder(BuildContext context, int index) {
    return changelogWidgets[index];
  }

  void getChangelogList(bool displayAllChangelog) {
    int currentVersion =
        Provider.of<SettingsProvider>(context, listen: false).currentVersion;
    changelogList = [];
    Constants.changelogs.keys
        .where((item) => displayAllChangelog ? true : item > currentVersion)
        .toList()
        .reversed
        .forEach((elm) => {changelogList.add(Constants.changelogs[elm])});

    print('changelogList: $changelogList');
  }

  Future<bool> _onWillPop() async {
    final settingProvider =
        Provider.of<SettingsProvider>(context, listen: false);
    settingProvider.currentVersion = Constants.currentVersion;
    return true;
  }

  void setCurrentVersionAndReturnHome() {
    final settingProvider =
        Provider.of<SettingsProvider>(context, listen: false);
    settingProvider.currentVersion = Constants.currentVersion;
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              SizedBox(
                height: 10,
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18.0),
                child: IconButton(
                  icon: Icon(
                    Icons.close,
                    size: 32,
                  ),
                  onPressed: setCurrentVersionAndReturnHome,
                ),
              ),
              SizedBox(
                height: 32,
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32.0),
                child: Text(
                  'Nouveautés',
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Divider(),
              Expanded(
                child: ListView.builder(
                  itemCount: changelogWidgets.length,
                  itemBuilder: (context, index) => _itemBuilder(context, index),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: <Widget>[
                  Padding(
                    padding:
                        const EdgeInsets.only(bottom: 16.0, right: 16, top: 16),
                    child: CustomButton(
                      text: 'Continuer',
                      onPressed: setCurrentVersionAndReturnHome,
                    ),
                  )
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}
