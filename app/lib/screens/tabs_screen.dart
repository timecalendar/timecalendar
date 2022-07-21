import 'package:firebase_analytics/observer.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'package:timecalendar/providers/calendar_provider.dart';
import 'package:timecalendar/providers/events_provider.dart';
import 'package:timecalendar/providers/settings_provider.dart';
import 'package:timecalendar/screens/add_personal_event.dart';
import 'package:timecalendar/screens/calendar_screen.dart';
import 'package:timecalendar/screens/changelog_screen.dart';
import 'package:timecalendar/screens/home_screen.dart';
import 'package:timecalendar/screens/profile_screen.dart';
import 'package:timecalendar/services/notification/notification.dart';
import 'package:timecalendar/utils/constants.dart';
import 'package:timecalendar/utils/snackbar.dart';
import 'package:timecalendar/screens/activity_screen.dart';

class TabsScreen extends StatefulWidget {
  TabsScreen(this.observer);
  static const routeName = '/tabs_screen';
  static const navigationBarHeight = 60.0;
  final FirebaseAnalyticsObserver observer;

  @override
  _TabsScreenState createState() => _TabsScreenState(observer);
}

class _TabsScreenState extends State<TabsScreen>
    with SingleTickerProviderStateMixin, RouteAware {
  _TabsScreenState(this.observer);

  final GlobalKey<ScaffoldState> _scaffoldKey = new GlobalKey<ScaffoldState>();

  final FirebaseAnalyticsObserver observer;

  final List<Map<String, Object>> _pages = [
    {
      'page': (ctx, observer) => HomeScreen(observer: observer),
      'title': 'Accueil',
      'slug': 'home',
    },
    {
      'page': (ctx, observer) =>
          CalendarScreen(parentContext: ctx, observer: observer),
      'title': 'Calendrier',
      'slug': 'calendar',
    },
    {
      'page': (ctx, observer) => ProfileScreen(),
      'title': 'Profil',
      'slug': 'profile',
    },
  ];
  int _selectedPageIndex = 0;
  bool _checkDisplayChangelog = false;

  void showActivitySnackbar(Map<String, dynamic> _) {
    showSnackBar(
      context,
      SnackBar(
        content: Text('Nouvelle activité'),
        action: SnackBarAction(
          label: 'Voir',
          onPressed: () {
            Navigator.of(context).pushNamed(ActivityScreen.routeName);
          },
        ),
      ),
    );

    Provider.of<SettingsProvider>(context, listen: false).newActivity = true;
  }

  void _selectPage(int index) {
    setState(() {
      _selectedPageIndex = index;
      _sendCurrentTabToAnalytics();
    });
  }

  @override
  void initState() {
    super.initState();
    var notificationService = NotificationService();
    notificationService.addEventListener(
      NotificationAction.CALENDAR_CHANGED,
      showActivitySnackbar,
    );

    Future.delayed(Duration.zero).then((_) {
      // Get startup screen
      var startupScreen =
          Provider.of<SettingsProvider>(context, listen: false).startupScreen;
      setState(() {
        _selectedPageIndex = (startupScreen == 'calendar') ? 1 : 0;
      });

      // Load events
      loadEventsOnStartup();
    });
  }

  void loadEventsOnStartup() {
    // Load events for the first time
    var calendarProvider =
        Provider.of<CalendarProvider>(context, listen: false);
    if (!calendarProvider.isLoaded) {
      calendarProvider.isLoaded = true;
      var eventsProvider = Provider.of<EventsProvider>(context, listen: false);
      eventsProvider.loadEvents();
      observer.analytics.logEvent(
          name: 'refresh_calendar', parameters: {'action': 'on_startup'});
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    observer.subscribe(this, ModalRoute.of(context)!);
  }

  @override
  void dispose() {
    observer.unsubscribe(this);
    var notificationService = NotificationService();
    notificationService.removeEventListener(
      NotificationAction.CALENDAR_CHANGED,
      showActivitySnackbar,
    );
    super.dispose();
  }

  void displayChangelog(BuildContext context, int version) {
    _checkDisplayChangelog = true;
    if (version < Constants.currentVersion) {
      Navigator.of(context).pushNamed(ChangelogScreen.routeName);
    }
  }

  @override
  Widget build(BuildContext context) {
    final settingsProvider = Provider.of<SettingsProvider>(context);
    final appTheme = settingsProvider.currentTheme;
    if (!_checkDisplayChangelog) {
      WidgetsBinding.instance.addPostFrameCallback(
          (_) => displayChangelog(context, settingsProvider.currentVersion!));
    }

    return Scaffold(
      key: _scaffoldKey,
      floatingActionButton:
          (this._pages[_selectedPageIndex]['slug'] == 'calendar')
              ? FloatingActionButton(
                  onPressed: () {
                    Navigator.of(context)
                        .pushNamed(AddPersonalEventScreen.routeName);
                  },
                  child: Icon(Icons.add),
                )
              : null,
      backgroundColor: appTheme.backgroundColor,
      body: (_pages[_selectedPageIndex]['page'] as Function)(context, observer),
      // body: AnnotatedRegion<SystemUiOverlayStyle>(
      //   value: SystemUiOverlayStyle.dark,
      //   child: (_pages[_selectedPageIndex]['page'] as Function)(context, observer),
      // ),
      bottomNavigationBar: SizedBox(
        height: TabsScreen.navigationBarHeight +
            MediaQuery.of(context).padding.bottom,
        child: Container(
          child: BottomNavigationBar(
            onTap: _selectPage,
            backgroundColor: appTheme.backgroundColor,
            unselectedItemColor:
                settingsProvider.darkMode ? Colors.grey[500] : Colors.grey[600],
            selectedItemColor: Theme.of(context).colorScheme.secondary,
            currentIndex: _selectedPageIndex,
            type: BottomNavigationBarType.fixed,
            items: [
              BottomNavigationBarItem(
                icon: Icon(
                  FontAwesomeIcons.home,
                  size: 20,
                ),
                label: 'Accueil',
              ),
              BottomNavigationBarItem(
                icon: Icon(
                  FontAwesomeIcons.calendarAlt,
                  size: 20,
                ),
                label: 'Calendrier',
              ),
              BottomNavigationBarItem(
                icon: Icon(
                  FontAwesomeIcons.user,
                ),
                label: 'Profil',
              ),
            ],
          ),
          decoration: settingsProvider.darkMode
              ? BoxDecoration(
                  border: Border(
                    top: BorderSide(
                      width: 1,
                      color: Colors.grey[700]!,
                    ),
                  ),
                )
              : null,
        ),
      ),
    );
  }

  @override
  void didPush() {
    _sendCurrentTabToAnalytics();
  }

  @override
  void didPopNext() {
    _sendCurrentTabToAnalytics();
  }

  void _sendCurrentTabToAnalytics() {
    observer.analytics.setCurrentScreen(
      screenName:
          '${TabsScreen.routeName}/tab_${_pages[_selectedPageIndex]['slug']}',
    );
  }
}
