import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/changelog/models/changelog.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/shared/constants/constants.dart';
import 'package:timecalendar/modules/changelog/widgets/changelog_item_header.dart';
import 'package:timecalendar/modules/changelog/widgets/changelog_item_new_features.dart';
import 'package:timecalendar/modules/shared/widgets/ui/custom_button.dart';

class ChangelogScreen extends StatefulWidget {
  static const routeName = '/changelog';

  @override
  _ChangelogScreenState createState() => _ChangelogScreenState();
}

class _ChangelogScreenState extends State<ChangelogScreen> {
  late List<Changelog?> changelogList;
  List<Widget> changelogWidgets = [];

  @override
  void initState() {
    super.initState();

    Future.delayed(Duration.zero, () {
      final Map<String, dynamic>? args =
          ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>?;
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
      tmp.add(
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: ChangelogItemHeader(changelog: item),
        ),
      );
      for (var features in item!.changelogItems) {
        tmp.add(
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: ChangelogItemNewFeatures(changelogItem: features),
          ),
        );
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
    int? currentVersion = Provider.of<SettingsProvider>(
      context,
      listen: false,
    ).currentVersion;
    changelogList = [];
    Constants.changelogs.keys
        .where((item) => displayAllChangelog ? true : item > currentVersion!)
        .toList()
        .reversed
        .forEach((elm) => changelogList.add(Constants.changelogs[elm]));
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          final settingProvider = Provider.of<SettingsProvider>(
            context,
            listen: false,
          );
          settingProvider.currentVersion = Constants.currentVersion;
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18.0),
                child: IconButton(
                  icon: Icon(Icons.close, size: 32),
                  onPressed: () {
                    final settingProvider = Provider.of<SettingsProvider>(
                      context,
                      listen: false,
                    );
                    settingProvider.currentVersion = Constants.currentVersion;
                    Navigator.of(context).pop();
                  },
                ),
              ),
              SizedBox(height: 32),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32.0),
                child: Text(
                  'Nouveautés',
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.w600),
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
                    padding: const EdgeInsets.only(
                      bottom: 16.0,
                      right: 16,
                      top: 16,
                    ),
                    child: CustomButton(
                      text: 'Continuer',
                      onPressed: () {
                        final settingProvider = Provider.of<SettingsProvider>(
                          context,
                          listen: false,
                        );
                        settingProvider.currentVersion =
                            Constants.currentVersion;
                        Navigator.of(context).pop();
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
