import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:timecalendar/modules/calendar/screens/user_calendars_screen.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/activity/screens/activity_screen.dart';
import 'package:timecalendar/modules/settings/screens/settings_screen.dart';
import 'package:timecalendar/modules/suggestion/screens/suggestion_screen.dart';
import 'package:timecalendar/modules/profile/widgets/profile_header.dart';
import 'package:timecalendar/modules/profile/widgets/profile_item.dart';
import 'package:timecalendar/modules/about/screens/about_screen.dart';

class ProfileScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);

    return SingleChildScrollView(
      child: Column(
        children: <Widget>[
          ProfileHeader(),
          ProfileItem(
            title: 'Activité',
            icon: const FaIcon(FontAwesomeIcons.list),
            action: () {
              Navigator.of(context).pushNamed(ActivityScreen.routeName);
            },
            unread: settings.newActivity,
          ),
          ProfileItem(
            title: 'Calendriers',
            icon: const FaIcon(FontAwesomeIcons.calendar),
            action: () {
              Navigator.of(context).pushNamed(UserCalendarsScreen.routeName);
            },
          ),
          ProfileItem(
            title: 'Paramètres',
            icon: const FaIcon(FontAwesomeIcons.gear),
            action: () {
              Navigator.of(context).pushNamed(SettingsScreen.routeName);
            },
          ),
          ProfileItem(
            title: 'A propos',
            icon: const FaIcon(FontAwesomeIcons.info),
            action: () {
              Navigator.of(context).pushNamed(AboutScreen.routeName);
            },
          ),
          ProfileItem(
            title: 'Vos retours et suggestions',
            icon: const FaIcon(FontAwesomeIcons.paperPlane),
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
