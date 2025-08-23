import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/calendar/screens/user_calendars_screen.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/activity/screens/activity_screen.dart';
import 'package:timecalendar/modules/settings/screens/settings_screen.dart';
import 'package:timecalendar/modules/suggestion/screens/suggestion_screen.dart';
import 'package:timecalendar/modules/profile/widgets/profile_header.dart';
import 'package:timecalendar/modules/profile/widgets/profile_item.dart';
import 'package:timecalendar/modules/about/screens/about_screen.dart';

class ProfileScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    var settingsProvider = Provider.of<SettingsProvider>(context);

    return SingleChildScrollView(
      child: Column(
        children: <Widget>[
          ProfileHeader(),
          ProfileItem(
            title: 'Activité',
            icon: FontAwesomeIcons.list,
            action: () {
              Navigator.of(context).pushNamed(ActivityScreen.routeName);
            },
            unread: settingsProvider.newActivity,
          ),
          ProfileItem(
            title: 'Calendriers',
            icon: FontAwesomeIcons.calendar,
            action: () {
              Navigator.of(context).pushNamed(UserCalendarsScreen.routeName);
            },
          ),
          ProfileItem(
            title: 'Paramètres',
            icon: FontAwesomeIcons.gear,
            action: () {
              Navigator.of(context).pushNamed(SettingsScreen.routeName);
            },
          ),
          ProfileItem(
            title: 'A propos',
            icon: FontAwesomeIcons.info,
            action: () {
              Navigator.of(context).pushNamed(AboutScreen.routeName);
            },
          ),
          ProfileItem(
            title: 'Vos retours et suggestions',
            icon: FontAwesomeIcons.paperPlane,
            action: () {
              Navigator.of(context).pushNamed(
                SuggestionScreen.routeName,
                arguments: SuggestionScreenArguments(
                  fromFailedIcalImport: false,
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
