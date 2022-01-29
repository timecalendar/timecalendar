import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/providers/suggestion_provider.dart';
import 'package:timecalendar/screens/activity_screen.dart';
import 'package:timecalendar/screens/school_selection_screen.dart';
import 'package:timecalendar/screens/settings/settings_screen.dart';
import 'package:timecalendar/screens/suggestion_screen.dart';
import 'package:timecalendar/widgets/profile/profile_header.dart';
import 'package:timecalendar/widgets/profile/profile_item.dart';

import 'about_screen.dart';

class ProfileScreen extends StatelessWidget {
  // Future<void> _handleSignIn() async {
  //   GoogleSignIn _googleSignIn = GoogleSignIn(
  //     scopes: [
  //       'https://www.googleapis.com/auth/userinfo.email',
  //       'https://www.googleapis.com/auth/userinfo.profile'
  //     ],
  //   );
  //   try {
  //     final account = await _googleSignIn.signIn();

  //     final authHeaders = await _googleSignIn.currentUser.authHeaders;
  //     print(authHeaders);
  //   } catch (error) {
  //     print(error);
  //   }
  // }

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
            title: 'Groupes',
            icon: FontAwesomeIcons.users,
            action: () {
              Navigator.of(context).pushNamed(SelectSchool.routeName);
            },
          ),
          // ProfileItem(
          //   title: 'Compte',
          //   icon: FontAwesomeIcons.user,
          //   action: () {
          //     Navigator.of(context).pushNamed(LoginScreen.routeName);
          //   },
          // ),
          // ProfileItem(
          //     title: 'Notifications',
          //     icon: FontAwesomeIcons.bell,
          //     action: () {}),
          ProfileItem(
            title: 'Paramètres',
            icon: FontAwesomeIcons.cog,
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
              final suggestionProvider =
                  Provider.of<SuggestionProvider>(context, listen: false);
              suggestionProvider.isFailedSuggestion = false;
              Navigator.of(context).pushNamed(SuggestionScreen.routeName);
            },
          ),
          // Row(
          //   mainAxisAlignment: MainAxisAlignment.center,
          //   children: <Widget>[
          //     CustomButton(
          //       onPressed: () {
          //         _handleSignIn();
          //       },
          //       text: "Connexion à Gogole",
          //     )
          //   ],
          // )
        ],
      ),
    );
  }
}
