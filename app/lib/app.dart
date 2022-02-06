import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart' as riverpod;
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timecalendar/modules/qr_code/screens/qr_code_screen.dart';
import 'package:timecalendar/modules/shared/widgets/unfocus.dart';
import 'package:timecalendar/providers/activity_provider.dart';
import 'package:timecalendar/providers/old_assistant_provider.dart';
import 'package:timecalendar/providers/auth_provider.dart';
import 'package:timecalendar/providers/calendar_provider.dart';
import 'package:timecalendar/providers/checklist_provider.dart';
import 'package:timecalendar/providers/note_provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/providers/suggestion_provider.dart';
import 'package:timecalendar/screens/activity_screen.dart';
import 'package:timecalendar/modules/add_grade/screens/add_grade_screen.dart';
import 'package:timecalendar/screens/add_personal_event.dart';
import 'package:timecalendar/modules/add_school/screens/add_school_screen.dart';
import 'package:timecalendar/screens/assistant_screen.dart';
import 'package:timecalendar/screens/changelog_screen.dart';
import 'package:timecalendar/screens/connect_screen.dart';
import 'package:timecalendar/screens/event_details_screen.dart';
import 'package:timecalendar/screens/hidden_events_screen.dart';
import 'package:timecalendar/screens/import_ical_screen.dart';
import 'package:timecalendar/screens/login_screen.dart';
import 'package:timecalendar/modules/onboarding/screens/onboarding_screen.dart';
import 'package:timecalendar/modules/school/screens/school_selection/school_selection_screen.dart';
import 'package:timecalendar/screens/settings/settings_screen.dart';
import 'package:timecalendar/screens/splash_screen.dart';
import 'package:timecalendar/screens/suggestion_screen.dart';
import 'package:timecalendar/screens/tabs_screen.dart';
import 'package:timecalendar/services/firebase.dart';
import 'package:timecalendar/services/my_route_observer.dart';
import 'package:timecalendar/services/notification/notification.dart';
import 'package:timecalendar/services/theme.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/screens/about_screen.dart';

class TimeCalendarApp extends StatefulWidget {
  final SharedPreferences prefs;

  TimeCalendarApp(this.prefs);

  @override
  _TimeCalendarAppState createState() => _TimeCalendarAppState();
}

class _TimeCalendarAppState extends State<TimeCalendarApp> {
  static FirebaseAnalytics analytics = FirebaseService.analytics;
  static FirebaseAnalyticsObserver observer = FirebaseService.observer;

  @override
  void initState() {
    super.initState();
    NotificationService();
  }

  @override
  Widget build(BuildContext context) {
    return riverpod.ProviderScope(
      child: Unfocus(
        child: MultiProvider(
          providers: [
            ChangeNotifierProvider(
              create: (_) => EventsProvider(),
            ),
            ChangeNotifierProvider(
              create: (_) => ActivityProvider(),
            ),
            ChangeNotifierProvider(
              create: (_) => SettingsProvider(),
            ),
            ChangeNotifierProvider(
              create: (_) => SuggestionProvider(),
            ),
            ChangeNotifierProvider(
              create: (_) => OldAssistantProvider(),
            ),
            ChangeNotifierProvider(
              create: (_) => NoteProvider(),
            ),
            ChangeNotifierProvider(
              create: (_) => CalendarProvider(),
            ),
            ChangeNotifierProvider(
              create: (_) => ChecklistProvider(),
            ),
            ChangeNotifierProvider(
              create: (_) => AuthProvider(),
            ),
          ],
          child: Builder(
            builder: (BuildContext context) {
              final settingsProvider = Provider.of<SettingsProvider>(context);
              final darkMode = settingsProvider.darkMode;

              SystemUiOverlayStyle style = darkMode
                  ? SystemUiOverlayStyle.light
                  : SystemUiOverlayStyle.dark;
              AppTheme appTheme = settingsProvider.currentTheme;
              ThemeData? theme = appTheme.theme;

              SystemChrome.setSystemUIOverlayStyle(style.copyWith(
                statusBarColor: Colors.transparent,
              ));

              return MaterialApp(
                navigatorObservers: [
                  MyRouteObserver(darkMode: darkMode),
                  FirebaseAnalyticsObserver(analytics: analytics),
                ],
                localizationsDelegates: [
                  GlobalMaterialLocalizations.delegate,
                  GlobalWidgetsLocalizations.delegate,
                  GlobalCupertinoLocalizations.delegate,
                ],
                supportedLocales: [
                  const Locale('fr'),
                  const Locale('en'),
                ],
                debugShowCheckedModeBanner: false,
                title: 'TimeCalendar',
                theme: theme,
                initialRoute: SplashScreen.routeName,
                routes: {
                  SplashScreen.routeName: (ctx) => SplashScreen(),
                  TabsScreen.routeName: (ctx) => TabsScreen(observer),
                  EventDetailsScreen.routeName: (ctx) => EventDetailsScreen(),
                  SelectSchool.routeName: (ctx) => SelectSchool(),
                  SettingsScreen.routeName: (ctx) => SettingsScreen(),
                  ActivityScreen.routeName: (ctx) => ActivityScreen(),
                  AboutScreen.routeName: (ctx) => AboutScreen(),
                  SuggestionScreen.routeName: (ctx) => SuggestionScreen(),
                  OnboardingScreen.routeName: (ctx) => OnboardingScreen(),
                  AssistantScreen.routeName: (ctx) => AssistantScreen(),
                  AddSchoolScreen.routeName: (ctx) => AddSchoolScreen(),
                  AddGradeScreen.routeName: (ctx) => AddGradeScreen(),
                  ImportIcalScreen.routeName: (ctx) => ImportIcalScreen(),
                  HiddenEventsScreen.routeName: (ctx) => HiddenEventsScreen(),
                  LoginScreen.routeName: (ctx) => LoginScreen(),
                  ConnectScreen.routeName: (ctx) => ConnectScreen(),
                  ChangelogScreen.routeName: (ctx) => ChangelogScreen(),
                  AddPersonalEventScreen.routeName: (ctx) =>
                      AddPersonalEventScreen(),
                  QrCodeScreen.routeName: (ctx) => QrCodeScreen()
                },
              );
            },
          ),
        ),
      ),
    );
  }
}
