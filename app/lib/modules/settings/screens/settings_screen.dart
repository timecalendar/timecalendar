import 'package:flutter/material.dart';
import 'package:pref/pref.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/modules/firebase/services/firebase.dart';
import 'package:timecalendar/modules/hidden_event/screens/hidden_events_screen.dart';
import 'package:timecalendar/modules/settings/providers/settings_provider.dart';
import 'package:timecalendar/modules/settings/widgets/app_pref_title.dart';

class SettingsScreen extends StatefulWidget {
  static const routeName = '/settings';
  @override
  _SettingsScreenState createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  // TODO: Calendar notification
  // int? _oldDateLimit;

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration.zero).then((_) async {
      // var settingsProvider =
      //     Provider.of<SettingsProvider>(context, listen: false);

      // setState(() {
      //   _oldDateLimit = settingsProvider.dateLimit;
      // });
    });
  }

  // String _dateLimitText(int? dateLimit) {
  //   switch (dateLimit) {
  //     case 0:
  //       return 'Tous les cours à venir';
  //     case 1:
  //       return 'Les cours de la journée';
  //     case 7:
  //       return 'Les cours de la semaine';
  //     case 14:
  //       return 'Les cours des deux prochaines semaines';
  //     case 31:
  //       return 'Les cours du mois';
  //     default:
  //       return '';
  //   }
  // }

  String _startupScreenText(String? value) {
    switch (value) {
      case 'calendar':
        return "Le calendrier";
      case 'home':
        return "L'écran d'accueil";
      default:
        return '';
    }
  }

  String _themeText(String? value) {
    switch (value) {
      case 'light':
        return "Clair";
      case 'dark':
        return "Sombre";
      default:
        return 'Thème par défaut du système';
    }
  }

  Future<void> _onSettingsChanged() async {
    final settingsProvider =
        Provider.of<SettingsProvider>(context, listen: false);
    await settingsProvider.loadSettings();
  }

  Future<void> changeNotificationSettings(BuildContext context) async {
    // TODO: Calendar notification
    // try {
    //   // Load calendar
    //   final calendars = await CalendarManager.loadCalendars();
    //   var notification = NotificationService();
    //   if (calendars.length > 0) {
    //     await notification.subscribeToCalendar(calendars[0]);
    //   }
    // } on Exception catch (_) {
    //   throw Exception('Aucune connexion.');
    // }
  }

  @override
  Widget build(BuildContext context) {
    var settingsProvider =
        Provider.of<SettingsProvider>(context, listen: false);

    return PrefService(
      service: settingsProvider.prefServiceShared!,
      child: Scaffold(
        appBar: AppBar(
          title: Text('Paramètres'),
        ),
        body: Builder(
          builder: (context) => PrefPage(children: [
            AppPrefTitle(title: Text('Notifications')),
            Padding(
              padding:
                  const EdgeInsets.only(left: 15.0, right: 15.0, bottom: 8.0),
              child: Text(
                  'Les notifications sont temporairement désactivées et seront disponibles prochainement.'),
            ),
            PrefSwitch(
              disabled: true,
              title: Text('Modifications du calendrier'),
              pref: 'notification_calendar_disabled',
              subtitle: Text(
                  'Recevoir une notification lors d\'un changement de calendrier'),
              // onEnable: () async {
              //   try {
              //     await changeNotificationSettings(context);
              //   } on Exception catch (error) {
              //     throw error;
              //   }
              // },
              // onDisable: () async {
              //   try {
              //     await changeNotificationSettings(context);
              //   } on Exception catch (error) {
              //     throw error;
              //   }
              // },
            ),
            // PrefDialogButton(
            //   title: Text('Recevoir des notifications concernant'),
            //   dialog: PrefDialog(
            //     children: [
            //       PrefRadio(
            //         title: Text(_dateLimitText(1)),
            //         pref: 'date_limit',
            //         value: 1,
            //       ),
            //       PrefRadio(
            //         title: Text(_dateLimitText(7)),
            //         pref: 'date_limit',
            //         value: 7,
            //       ),
            //       PrefRadio(
            //         title: Text(_dateLimitText(14)),
            //         pref: 'date_limit',
            //         value: 14,
            //       ),
            //       PrefRadio(
            //         title: Text(_dateLimitText(31)),
            //         pref: 'date_limit',
            //         value: 31,
            //       ),
            //       PrefRadio(
            //         title: Text(_dateLimitText(0)),
            //         pref: 'date_limit',
            //         value: 0,
            //       ),
            //     ],
            //     dismissOnChange: true,
            //   ),
            //   subtitle: Text(_dateLimitText(settingsProvider.dateLimit)),
            //   onSubmit: () async {
            //     await _onSettingsChanged();
            //     SharedPreferences prefs = await SharedPreferences.getInstance();
            //     try {
            //       await changeNotificationSettings(context);
            //       var dateLimit = prefs.getInt('date_limit');
            //       _oldDateLimit = dateLimit;
            //     } on Exception catch (_) {
            //       showSnackBar(
            //         context,
            //         SnackBar(
            //           content: Text('Aucune connexion.'),
            //         ),
            //       );
            //       prefs.setInt('date_limit', _oldDateLimit!);
            //       await _onSettingsChanged();
            //     }
            //   },
            // ),
            AppPrefTitle(title: Text('Calendrier')),
            PrefSwitch(
              title: Text('Afficher les couleurs par groupe'),
              pref: 'colors_by_group',
              subtitle: Text(
                  'Afficher les cours de type similaire (CM, TD, TP) de la même couleur'),
              onChange: (_) {
                settingsProvider.loadSettings();
              },
            ),
            PrefSwitch(
              title: Text('Afficher les week-ends'),
              pref: 'show_weekends',
              subtitle: Text('Afficher les week-ends dans la vue semaine'),
              onChange: (_) {
                settingsProvider.loadSettings();
              },
            ),
            ListTile(
              title: Text('Gérer les événements masqués'),
              subtitle: Text(
                'Afficher et gérer les événements masqués (événement seul ou groupe d\'événements)',
              ),
              onTap: () => {
                Navigator.pushNamed(context, HiddenEventsScreen.routeName),
              },
            ),
            AppPrefTitle(title: Text('Application')),
            PrefDialogButton(
              title: Text('Thème'),
              dialog: PrefDialog(
                children: [
                  PrefRadio(
                    title: Text(_themeText('light')),
                    pref: 'theme',
                    value: 'light',
                  ),
                  PrefRadio(
                    title: Text(_themeText('dark')),
                    pref: 'theme',
                    value: 'dark',
                  ),
                  PrefRadio(
                    title: Text(_themeText('system')),
                    pref: 'theme',
                    value: 'system',
                  ),
                ],
                dismissOnChange: true,
              ),
              subtitle: Text(_themeText(settingsProvider.theme)),
              onSubmit: () async {
                _onSettingsChanged();
              },
            ),
            PrefDialogButton(
              title: Text('Afficher au démarrage de l\'application'),
              dialog: PrefDialog(
                children: [
                  PrefRadio(
                    title: Text(_startupScreenText('home')),
                    value: 'home',
                    pref: 'startup_screen',
                  ),
                  PrefRadio(
                    title: Text(_startupScreenText('calendar')),
                    value: 'calendar',
                    pref: 'startup_screen',
                  ),
                ],
                dismissOnChange: true,
              ),
              subtitle:
                  Text(_startupScreenText(settingsProvider.startupScreen)),
              onSubmit: () async {
                // Reload settings
                await _onSettingsChanged();

                FirebaseService.setStartupScreen(
                    settingsProvider.startupScreen);
              },
            ),
          ]),
        ),
      ),
    );
  }
}
